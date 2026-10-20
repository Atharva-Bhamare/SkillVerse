
import mongoose from "mongoose";
import Application from "../models/application.model.js";
import Job from "../models/job.model.js";
import AppError from "../utils/AppError.js";
import Student from "../models/student.model.js";
import logger from "../config/logger.js";
import { createNotification } from "./notification.service.js";

const MANAGEMENT_ROLES = ["admin", "placement_officer"];

const ALLOWED_STATUS_TRANSITIONS = Object.freeze({
  pending: ["reviewing", "rejected"],
  reviewing: ["shortlisted", "accepted", "rejected"],
  shortlisted: ["accepted", "rejected"],
  accepted: [],
  rejected: [],
  withdrawn: [],
});

const APPLICATION_POPULATE_OPTIONS = [
  {
    path: "student",
    select: "fullName email",
  },
  {
    path: "job",
    select:
      "title company employmentType workMode location applicationDeadline status isActive",
    populate: {
      path: "company",
      select: "name industry location",
    },
  },
  {
    path: "statusUpdatedBy",
    select: "fullName",
  },
];

const isManagementRole = (role) =>
  MANAGEMENT_ROLES.includes(role);

const validateObjectId = (id, label = "ID") => {
  if (!mongoose.isValidObjectId(id)) {
    throw new AppError(`Invalid ${label}.`, 400);
  }
};

const ensureStudent = (userRole) => {
  if (userRole !== "student") {
    throw new AppError(
      "Only student accounts can submit or withdraw applications.",
      403
    );
  }
};

const ensureManagement = (userRole) => {
  if (!isManagementRole(userRole)) {
    throw new AppError(
      "You are not authorized to manage applications.",
      403
    );
  }
};

const getApplicationForManagement = async (applicationId) => {
  validateObjectId(applicationId, "application ID");

  const application = await Application.findById(applicationId);

  if (!application) {
    throw new AppError("Application not found.", 404);
  }

  return application;
};

const getOwnedApplication = async (applicationId, studentId) => {
  validateObjectId(applicationId, "application ID");

  const application = await Application.findOne({
    _id: applicationId,
    student: studentId,
  });

  if (!application) {
    throw new AppError("Application not found.", 404);
  }

  return application;
};

const createApplication = async (
  applicationData,
  studentId,
  userRole
) => {
  ensureStudent(userRole);
  validateObjectId(applicationData.job, "job ID");

  const job = await Job.findOne({
    _id: applicationData.job,
    isActive: true,
    status: "open",
    applicationDeadline: { $gt: new Date() },
  });

  if (!job) {
    throw new AppError(
      "This job is unavailable or its application deadline has passed.",
      400
    );
  }

  const existingApplication = await Application.findOne({
    student: studentId,
    job: job._id,
  });

  if (existingApplication) {
    throw new AppError(
      "You have already applied for this job.",
      409
    );
  }

  // Use the profile resume when no resume URL is supplied.
  const student = await Student.findOne({
    user: studentId,
  });

  const resume = student?.resume?.url ?? null;

  let application;

  try {
    application = await Application.create({
      student: studentId,
      job: job._id,
      resume,
      coverLetter: applicationData.coverLetter ?? "",
      status: "pending",
    });
  } catch (error) {
    // Protect against concurrent duplicate submissions.
    if (error.code === 11000) {
      throw new AppError(
        "You have already applied for this job.",
        409
      );
    }

    throw error;
  }

  // Notify the user who posted the job.
  try {
    if (job.postedBy) {
      await createNotification({
        recipient: job.postedBy,
        type: "new_application",
        title: "New Job Application",
        message: "A student has applied for your job posting.",
        relatedApplication: application._id,
        relatedJob: job._id,
      });
    }
  } catch (error) {
    logger.error(
      `Failed to create new application notification: ${error.message}`
    );
  }

  return Application.findById(application._id).populate(
    APPLICATION_POPULATE_OPTIONS
  );
};

const getApplicationById = async (
  applicationId,
  userId,
  userRole
) => {
  validateObjectId(applicationId, "application ID");

  const query = { _id: applicationId };

  if (!isManagementRole(userRole)) {
    query.student = userId;
  }

  const application = await Application.findOne(query).populate(
    APPLICATION_POPULATE_OPTIONS
  );

  if (!application) {
    throw new AppError("Application not found.", 404);
  }

  return application;
};

const listApplications = async (
  filters = {},
  userId,
  userRole
) => {
  const page = Math.max(Number(filters.page) || 1, 1);
  const limit = Math.min(
    Math.max(Number(filters.limit) || 10, 1),
    100
  );
  const skip = (page - 1) * limit;

  const query = {};

  if (isManagementRole(userRole)) {
    if (filters.job) {
      validateObjectId(filters.job, "job ID");
      query.job = filters.job;
    }

    if (filters.student) {
      validateObjectId(filters.student, "student ID");
      query.student = filters.student;
    }
  } else {
    query.student = userId;
  }

  if (filters.status) {
    query.status = filters.status;
  }

  const [applications, total] = await Promise.all([
    Application.find(query)
      .populate(APPLICATION_POPULATE_OPTIONS)
      .sort({ appliedAt: -1 })
      .skip(skip)
      .limit(limit),
    Application.countDocuments(query),
  ]);

  return {
    applications,
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

const updateApplicationStatus = async (
  applicationId,
  updateData,
  userId,
  userRole
) => {
  ensureManagement(userRole);

  const application = await getApplicationForManagement(
    applicationId
  );

  const currentStatus = application.status;
  const requestedStatus = updateData.status;

  if (currentStatus === "withdrawn") {
    throw new AppError(
      "A withdrawn application cannot be updated.",
      409
    );
  }

  if (
    currentStatus !== requestedStatus &&
    !ALLOWED_STATUS_TRANSITIONS[currentStatus]?.includes(
      requestedStatus
    )
  ) {
    throw new AppError(
      `Cannot change application status from "${currentStatus}" to "${requestedStatus}".`,
      409
    );
  }

  application.status = requestedStatus;
  application.statusUpdatedBy = userId;

  if (updateData.notes !== undefined) {
    application.notes = updateData.notes;
  }

  await application.save();

  // Notify the student only when the status actually changes.
  if (currentStatus !== requestedStatus) {
    try {
      await createNotification({
        recipient: application.student,
        type: "application_status",
        title: "Application Status Updated",
        message: `Your application status has changed to ${requestedStatus}.`,
        relatedApplication: application._id,
        relatedJob: application.job,
      });
    } catch (error) {
      // Notification failure should not undo a successful status update.
      logger.error(
        `Failed to create application status notification: ${error.message}`
      );
    }
  }

  return Application.findById(application._id).populate(
    APPLICATION_POPULATE_OPTIONS
  );
};

const withdrawApplication = async (
  applicationId,
  userId,
  userRole
) => {
  ensureStudent(userRole);

  const application = await getOwnedApplication(
    applicationId,
    userId
  );

  if (
    application.status === "accepted" ||
    application.status === "rejected"
  ) {
    throw new AppError(
      "An accepted or rejected application cannot be withdrawn.",
      409
    );
  }

  if (application.status === "withdrawn") {
    throw new AppError(
      "This application has already been withdrawn.",
      409
    );
  }

  application.status = "withdrawn";
  application.statusUpdatedBy = userId;

  await application.save();

  return Application.findById(application._id).populate(
    APPLICATION_POPULATE_OPTIONS
  );
};

export default {
  createApplication,
  getApplicationById,
  listApplications,
  updateApplicationStatus,
  withdrawApplication,
};
