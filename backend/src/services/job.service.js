
import mongoose from "mongoose";

import Job from "../models/job.model.js";
import Company from "../models/company.model.js";
import Application from "../models/application.model.js";
import Notification from "../models/notification.model.js";
import User from "../models/user.model.js";

import AppError from "../utils/AppError.js";

const MANAGEMENT_ROLES = ["admin", "placement_officer"];

const POPULATE_OPTIONS = [
  {
    path: "company",
    select: "name industry location logo isActive",
  },
  {
    path: "postedBy",
    select: "fullName",
  },
];

const isManagementRole = (role) =>
  MANAGEMENT_ROLES.includes(role);

const escapeRegex = (value) => {
  return String(value)
    .split("")
    .map((char) =>
      "\\^$.*+?()[]{}|".includes(char)
        ? `\\${char}`
        : char
    )
    .join("");
};

const validateJobId = (jobId) => {
  if (!mongoose.isValidObjectId(jobId)) {
    throw new AppError("Invalid job ID.", 400);
  }
};

const validateCompany = async (companyId) => {
  if (!mongoose.isValidObjectId(companyId)) {
    throw new AppError("Invalid company ID.", 400);
  }

  const company = await Company.findOne({
    _id: companyId,
    isActive: true,
  });

  if (!company) {
    throw new AppError("Active company not found.", 404);
  }

  return company;
};

const validateDeadline = (deadline) => {
  if (!deadline || Number.isNaN(new Date(deadline).getTime())) {
    throw new AppError("A valid application deadline is required.", 400);
  }

  if (new Date(deadline).getTime() <= Date.now()) {
    throw new AppError(
      "An open job must have an application deadline in the future.",
      400
    );
  }
};

const getAssignedCompanyForOfficer = async (userId) => {
  if (!mongoose.isValidObjectId(userId)) {
    throw new AppError("Invalid placement officer ID.", 400);
  }

  const officer = await User.findOne({
    _id: userId,
    role: "placement_officer",
    isActive: true,
  }).select("company");

  if (!officer) {
    throw new AppError("Active placement officer not found.", 404);
  }

  if (!officer.company) {
    throw new AppError(
      "You are not currently assigned to a company. Please contact the administrator.",
      403
    );
  }

  const company = await Company.findById(officer.company);

  if (!company) {
    throw new AppError(
      "Your assigned company could not be found. Please contact the administrator to update your company assignment.",
      404
    );
  }

  if (!company.isActive) {
    throw new AppError(
      "Your assigned company is currently inactive. Please contact the administrator to reactivate it.",
      403
    );
  }

  return company._id;
};

// Management can retrieve inactive jobs when needed.
// Deactivation itself still requires an active job.
const getJobForManagement = async (
  jobId,
  userId,
  userRole,
  includeInactive = false
) => {
  validateJobId(jobId);

  if (!isManagementRole(userRole)) {
    throw new AppError("You are not authorized to manage jobs.", 403);
  }

  const query = {
    _id: jobId,
  };

  if (!includeInactive) {
    query.isActive = true;
  }

  if (userRole === "placement_officer") {
    query.company = await getAssignedCompanyForOfficer(userId);
  }

  const job = await Job.findOne(query).populate(POPULATE_OPTIONS);

  if (!job) {
    throw new AppError("Job not found.", 404);
  }

  return job;
};

// Create job
const createJob = async (jobData, userId, userRole) => {
  if (!isManagementRole(userRole)) {
    throw new AppError("You are not authorized to create jobs.", 403);
  }

  const company = await validateCompany(jobData.company);

  if (userRole === "placement_officer") {
    const assignedCompanyId =
      await getAssignedCompanyForOfficer(userId);

    if (company._id.toString() !== assignedCompanyId.toString()) {
      throw new AppError(
        "You can create jobs only for your assigned company.",
        403
      );
    }
  }

  const status = jobData.status ?? "draft";

  if (status === "open") {
    validateDeadline(jobData.applicationDeadline);
  }

  const job = await Job.create({
    ...jobData,
    postedBy: userId,
    status,
  });

  return Job.findById(job._id).populate(POPULATE_OPTIONS);
};

// Get individual job
const getJobById = async (jobId, userRole, userId) => {
  validateJobId(jobId);

  const query = {
    _id: jobId,
  };

  if (!isManagementRole(userRole)) {
    // Students can only retrieve active jobs belonging to active companies.
    const activeCompanyIds = await Company.find({
      isActive: true,
    }).distinct("_id");

    query.isActive = true;
    query.company = { $in: activeCompanyIds };
    query.status = "open";
    query.applicationDeadline = { $gt: new Date() };
  } else if (userRole === "placement_officer") {
    query.company = await getAssignedCompanyForOfficer(userId);
  }

  const job = await Job.findOne(query).populate(POPULATE_OPTIONS);

  if (!job) {
    throw new AppError("Job not found.", 404);
  }

  return job;
};

// List jobs
const listJobs = async (filters = {}, userRole, userId) => {
  const page = Math.max(Number(filters.page) || 1, 1);

  const limit = Math.min(
    Math.max(Number(filters.limit) || 10, 1),
    100
  );

  const skip = (page - 1) * limit;

  const query = {};

  // --------------------------------------------------
  // 1. STUDENT ACCESS
  // Students can only see active jobs from active
  // companies that are open and within the deadline.
  // --------------------------------------------------

  if (!isManagementRole(userRole)) {
    const activeCompanyIds = await Company.find({
      isActive: true,
    }).distinct("_id");

    query.isActive = true;
    query.company = { $in: activeCompanyIds };
    query.status = "open";
    query.applicationDeadline = { $gt: new Date() };
  }

  // --------------------------------------------------
  // 2. MANAGEMENT ACCESS
  // Admin and placement officers can request:
  // isActive=true  -> Active jobs
  // isActive=false -> Inactive jobs
  // isActive=all   -> Both active and inactive jobs
  // --------------------------------------------------

  else {
    const activeFilter = filters.isActive ?? "true";

    if (
      activeFilter === "true" ||
      activeFilter === true
    ) {
      query.isActive = true;
    } else if (
      activeFilter === "false" ||
      activeFilter === false
    ) {
      query.isActive = false;
    } else if (activeFilter !== "all") {
      throw new AppError(
        "Invalid isActive filter. Use true, false, or all.",
        400
      );
    }

    // Placement officers can only manage jobs
    // belonging to their assigned company.
    if (userRole === "placement_officer") {
      query.company = await getAssignedCompanyForOfficer(userId);
    }

    // Optional job status filter.
    if (filters.status) {
      query.status = filters.status;
    }
  }

  // --------------------------------------------------
  // 3. COMPANY FILTER
  // --------------------------------------------------

  if (filters.company) {
    if (!mongoose.isValidObjectId(filters.company)) {
      throw new AppError("Invalid company ID.", 400);
    }

    if (userRole === "placement_officer") {
      const assignedCompanyId = query.company.toString();

      if (filters.company.toString() !== assignedCompanyId) {
        throw new AppError(
          "You can only view jobs belonging to your assigned company.",
          403
        );
      }
    } else {
      query.company = filters.company;
    }
  }

  // --------------------------------------------------
  // 4. EMPLOYMENT TYPE FILTER
  // --------------------------------------------------

  if (filters.employmentType) {
    query.employmentType = filters.employmentType;
  }

  // --------------------------------------------------
  // 5. WORK MODE FILTER
  // --------------------------------------------------

  if (filters.workMode) {
    query.workMode = filters.workMode;
  }

  // --------------------------------------------------
  // 6. LOCATION FILTER
  // --------------------------------------------------

  if (filters.location) {
    query.location = {
      $regex: escapeRegex(filters.location),
      $options: "i",
    };
  }

  // --------------------------------------------------
  // 7. SEARCH FILTER
  // --------------------------------------------------

  if (filters.search) {
    const searchRegex = new RegExp(
      escapeRegex(filters.search),
      "i"
    );

    query.$or = [
      { title: searchRegex },
      { description: searchRegex },
      { skills: searchRegex },
      { requirements: searchRegex },
    ];
  }

  // --------------------------------------------------
  // 8. SKILLS FILTER
  // --------------------------------------------------

  if (filters.skills) {
    const skills = Array.isArray(filters.skills)
      ? filters.skills
      : String(filters.skills).split(",");

    const normalizedSkills = skills
      .map((skill) => String(skill).trim())
      .filter(Boolean);

    if (normalizedSkills.length > 0) {
      query.skills = {
        $in: normalizedSkills.map(
          (skill) => new RegExp(escapeRegex(skill), "i")
        ),
      };
    }
  }

  // --------------------------------------------------
  // 9. FETCH JOBS AND PAGINATION
  // --------------------------------------------------

  const [jobs, total] = await Promise.all([
    Job.find(query)
      .populate(POPULATE_OPTIONS)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),

    Job.countDocuments(query),
  ]);

  return {
    jobs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPreviousPage: page > 1,
    },
  };
};

// Update job
const updateJob = async (jobId, updateData, userId, userRole) => {
  if (!isManagementRole(userRole)) {
    throw new AppError("You are not authorized to update jobs.", 403);
  }

  // Allow management to update an inactive job too.
  const job = await getJobForManagement(
    jobId,
    userId,
    userRole,
    true
  );

  if (updateData.company !== undefined) {
    if (userRole === "placement_officer") {
      throw new AppError(
        "Placement officers cannot change a job's assigned company.",
        403
      );
    }

    await validateCompany(updateData.company);
  }

  const nextStatus = updateData.status ?? job.status;

  const nextDeadline =
    updateData.applicationDeadline ?? job.applicationDeadline;

  if (nextStatus === "open") {
    validateDeadline(nextDeadline);
  }

  const currentSalary = {
    min: job.salary?.min ?? null,
    max: job.salary?.max ?? null,
    currency: job.salary?.currency ?? "INR",
    isDisclosed: job.salary?.isDisclosed ?? true,
  };

  const nextSalary = updateData.salary
    ? { ...currentSalary, ...updateData.salary }
    : currentSalary;

  if (
    nextSalary.min != null &&
    nextSalary.max != null &&
    Number(nextSalary.max) < Number(nextSalary.min)
  ) {
    throw new AppError(
      "Maximum salary must be greater than or equal to minimum salary.",
      400
    );
  }

  const currentExperience = {
    minYears: job.experience?.minYears ?? 0,
    maxYears: job.experience?.maxYears ?? null,
  };

  const nextExperience = updateData.experience
    ? { ...currentExperience, ...updateData.experience }
    : currentExperience;

  if (
    nextExperience.maxYears != null &&
    Number(nextExperience.maxYears) <
      Number(nextExperience.minYears)
  ) {
    throw new AppError(
      "Maximum experience must be greater than or equal to minimum experience.",
      400
    );
  }

  const allowedFields = [
    "title",
    "description",
    "responsibilities",
    "requirements",
    "skills",
    "company",
    "employmentType",
    "workMode",
    "location",
    "openings",
    "applicationDeadline",
    "status",
  ];

  for (const field of allowedFields) {
    if (updateData[field] !== undefined) {
      job[field] = updateData[field];
    }
  }

  if (updateData.salary !== undefined) {
    job.salary = nextSalary;
  }

  if (updateData.experience !== undefined) {
    job.experience = nextExperience;
  }

  await job.save();

  return Job.findById(job._id).populate(POPULATE_OPTIONS);
};

// Deactivate job
const deactivateJob = async (jobId, userId, userRole) => {
  if (!isManagementRole(userRole)) {
    throw new AppError(
      "You are not authorized to deactivate jobs.",
      403
    );
  }

  const job = await getJobForManagement(
    jobId,
    userId,
    userRole
  );

  job.isActive = false;

  await job.save();

  return job;
};

// Reactivate job
const reactivateJob = async (jobId, userId, userRole) => {
  if (!isManagementRole(userRole)) {
    throw new AppError(
      "You are not authorized to reactivate jobs.",
      403
    );
  }

  validateJobId(jobId);

  const query = { _id: jobId };

  if (userRole === "placement_officer") {
    query.company = await getAssignedCompanyForOfficer(userId);
  }

  const job = await Job.findOne(query);

  if (!job) {
    throw new AppError("Job not found.", 404);
  }

  if (job.isActive) {
    throw new AppError("Job is already active.", 409);
  }

  await validateCompany(job.company);

  // Only validate the deadline if the job's existing status is open.
  // Preserve draft, closed, or cancelled status.
  if (job.status === "open") {
    validateDeadline(job.applicationDeadline);
  }

  job.isActive = true;

  await job.save();

  return Job.findById(job._id).populate(POPULATE_OPTIONS);
};

// Permanently delete job, its applications, and related notifications.
const permanentlyDeleteJob = async (
  jobId,
  userId,
  userRole
) => {
  if (!isManagementRole(userRole)) {
    throw new AppError(
      "You are not authorized to permanently delete jobs.",
      403
    );
  }

  validateJobId(jobId);

  const session = await mongoose.startSession();

  let deletionResult;

  try {
    await session.withTransaction(async () => {
      const query = { _id: jobId };

      if (userRole === "placement_officer") {
        query.company = await getAssignedCompanyForOfficer(userId);
      }

      const job = await Job.findOne(query).session(session);

      if (!job) {
        throw new AppError("Job not found.", 404);
      }
      
      // Prevent permanent deletion of active jobs.
      if (job.isActive) {
        throw new AppError(
          "Deactivate the job before permanently deleting it.",
          400
        );
      }
      
      const applications = await Application.find({
        job: job._id,
      })
        .select("_id")
        .session(session);

      const applicationIds = applications.map(
        (application) => application._id
      );

      const notificationResult = await Notification.deleteMany(
        {
          $or: [
            { relatedJob: job._id },
            { relatedApplication: { $in: applicationIds } },
          ],
        },
        { session }
      );

      const applicationResult = await Application.deleteMany(
        { job: job._id },
        { session }
      );

      await Job.deleteOne(
        { _id: job._id },
        { session }
      );

      deletionResult = {
        deletedJob: true,
        deletedApplications: applicationResult.deletedCount,
        deletedNotifications: notificationResult.deletedCount,
      };
    });

    return deletionResult;
  } finally {
    await session.endSession();
  }
};

export default {
  createJob,
  getJobById,
  listJobs,
  updateJob,
  deactivateJob,
  reactivateJob,
  permanentlyDeleteJob,
};
