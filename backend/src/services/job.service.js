
import mongoose from "mongoose";
import Job from "../models/job.model.js";
import Company from "../models/company.model.js";
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

const escapeRegex = (value) => {
    return String(value).split("").map((char) => {
      if ("\\^$.*+?()[]{}|".includes(char)) {
        return "\\" + char;
      }
      return char;
    }).join("");
  };  

const isManagementRole = (role) => MANAGEMENT_ROLES.includes(role);

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

const getJobForManagement = async (jobId) => {
  validateJobId(jobId);

  const job = await Job.findOne({
    _id: jobId,
    isActive: true,
  }).populate(POPULATE_OPTIONS);

  if (!job) {
    throw new AppError("Job not found.", 404);
  }

  return job;
};

const createJob = async (jobData, userId, userRole) => {
  if (!isManagementRole(userRole)) {
    throw new AppError("You are not authorized to create jobs.", 403);
  }

  await validateCompany(jobData.company);

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

const getJobById = async (jobId, userRole) => {
  validateJobId(jobId);

  const query = {
    _id: jobId,
    isActive: true,
  };

  if (!isManagementRole(userRole)) {
    query.status = "open";
    query.applicationDeadline = { $gt: new Date() };
  }

  const job = await Job.findOne(query).populate(POPULATE_OPTIONS);

  if (!job) {
    throw new AppError("Job not found.", 404);
  }

  return job;
};

const listJobs = async (filters = {}, userRole) => {
  const page = Math.max(Number(filters.page) || 1, 1);
  const limit = Math.min(Math.max(Number(filters.limit) || 10, 1), 100);
  const skip = (page - 1) * limit;

  const query = {
    isActive: true,
  };

  if (!isManagementRole(userRole)) {
    query.status = "open";
    query.applicationDeadline = { $gt: new Date() };
  } else if (filters.status) {
    query.status = filters.status;
  }

  if (filters.company) {
    if (!mongoose.isValidObjectId(filters.company)) {
      throw new AppError("Invalid company ID.", 400);
    }

    query.company = filters.company;
  }

  if (filters.employmentType) {
    query.employmentType = filters.employmentType;
  }

  if (filters.workMode) {
    query.workMode = filters.workMode;
  }

  if (filters.location) {
    query.location = {
      $regex: escapeRegex(String(filters.location)),
      $options: "i",
    };
  }

  if (filters.search) {
    const searchRegex = new RegExp(
      escapeRegex(String(filters.search)),
      "i"
    );

    query.$or = [
      { title: searchRegex },
      { description: searchRegex },
      { skills: searchRegex },
      { requirements: searchRegex },
    ];
  }

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

const updateJob = async (jobId, updateData, userRole) => {
  if (!isManagementRole(userRole)) {
    throw new AppError("You are not authorized to update jobs.", 403);
  }

  const job = await getJobForManagement(jobId);

  if (updateData.company !== undefined) {
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
    Number(nextExperience.maxYears) < Number(nextExperience.minYears)
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

const deactivateJob = async (jobId, userRole) => {
  if (!isManagementRole(userRole)) {
    throw new AppError("You are not authorized to deactivate jobs.", 403);
  }

  const job = await getJobForManagement(jobId);

  job.isActive = false;
  await job.save();

  return job;
};

export default {
  createJob,
  getJobById,
  listJobs,
  updateJob,
  deactivateJob,
};
