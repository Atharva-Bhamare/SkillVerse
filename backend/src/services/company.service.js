
import mongoose from "mongoose";
import User from "../models/user.model.js";
import { ROLES } from "../config/constants.js";
import Company from "../models/company.model.js";
import Job from "../models/job.model.js";
import Application from "../models/application.model.js";
import Notification from "../models/notification.model.js";
import AppError from "../utils/AppError.js";

const escapeRegex = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const ensureValidCompanyId = (companyId) => {
  if (!mongoose.isValidObjectId(companyId)) {
    throw new AppError("A valid company ID is required.", 400);
  }
};

const findCompanyById = async (companyId) => {
  ensureValidCompanyId(companyId);

  const company = await Company.findById(companyId);

  if (!company) {
    throw new AppError("Company not found.", 404);
  }

  return company;
};

const findActiveCompanyById = async (companyId) => {
  const company = await findCompanyById(companyId);

  if (!company.isActive) {
    throw new AppError("Company not found.", 404);
  }

  return company;
};

const createCompany = async (companyData, userId) => {
  if (!mongoose.isValidObjectId(userId)) {
    throw new AppError("A valid creator ID is required.", 400);
  }

  const name = companyData.name?.trim();

  if (!name) {
    throw new AppError("Company name is required.", 400);
  }

  const existingCompany = await Company.findOne({
    name: { $regex: `^${escapeRegex(name)}$`, $options: "i" },
    isActive: true,
  });

  if (existingCompany) {
    throw new AppError(
      "An active company with this name already exists.",
      409
    );
  }

  return Company.create({
    name,
    description: companyData.description,
    industry: companyData.industry,
    website: companyData.website,
    location: companyData.location,
    contactEmail: companyData.contactEmail,
    contactPhone: companyData.contactPhone,
    createdBy: userId,
  });
};

const getCompanyById = async (companyId) => {
  return findActiveCompanyById(companyId);
};

const listCompanies = async (filters = {}) => {
  const page = Math.max(Number(filters.page) || 1, 1);
  const limit = Math.min(Math.max(Number(filters.limit) || 10, 1), 100);
  const skip = (page - 1) * limit;

  const filter = {};

  // Default: return active companies.
  // Admins can explicitly request inactive companies or all companies.
  if (filters.isActive === undefined || filters.isActive === "") {
    filter.isActive = true;
  } else if (filters.isActive === "true" || filters.isActive === true) {
    filter.isActive = true;
  } else if (
    filters.isActive === "false" ||
    filters.isActive === false
  ) {
    filter.isActive = false;
  }

  if (filters.search?.trim()) {
    const search = escapeRegex(filters.search.trim());

    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { industry: { $regex: search, $options: "i" } },
      { location: { $regex: search, $options: "i" } },
    ];
  }

  if (filters.industry?.trim()) {
    filter.industry = {
      $regex: `^${escapeRegex(filters.industry.trim())}$`,
      $options: "i",
    };
  }

  if (filters.location?.trim()) {
    filter.location = {
      $regex: escapeRegex(filters.location.trim()),
      $options: "i",
    };
  }

  const [companies, total] = await Promise.all([
    Company.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit),
    Company.countDocuments(filter),
  ]);

  return {
    companies,
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

const listPlacementOfficers = async () => {
  const officers = await User.find({
    role: ROLES.PLACEMENT_OFFICER,
  })
    .select("_id fullName email role company isActive")
    .populate("company", "name isActive")
    .sort({ fullName: 1, _id: 1 })
    .lean();

  return officers.map((officer) => ({
    id: officer._id.toString(),
    fullName: officer.fullName,
    email: officer.email,
    role: officer.role,
    isActive: officer.isActive,
    company: officer.company
      ? {
          id: officer.company._id.toString(),
          name: officer.company.name,
          isActive: officer.company.isActive,
        }
      : null,
  }));
};

const updateCompany = async (companyId, updateData) => {
  const company = await findActiveCompanyById(companyId);

  const allowedFields = [
    "name",
    "description",
    "industry",
    "website",
    "location",
    "contactEmail",
    "contactPhone",
    "logo",
  ];

  const updates = {};

  for (const field of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(updateData, field)) {
      updates[field] = updateData[field];
    }
  }

  if (Object.keys(updates).length === 0) {
    throw new AppError("No valid company fields were provided.", 400);
  }

  if (updates.name !== undefined) {
    updates.name = updates.name.trim();

    if (!updates.name) {
      throw new AppError("Company name cannot be empty.", 400);
    }

    const duplicate = await Company.findOne({
      _id: { $ne: company._id },
      name: {
        $regex: `^${escapeRegex(updates.name)}$`,
        $options: "i",
      },
      isActive: true,
    });

    if (duplicate) {
      throw new AppError(
        "An active company with this name already exists.",
        409
      );
    }
  }

  for (const [field, value] of Object.entries(updates)) {
    company[field] = value;
  }

  await company.save();

  return company;
};

const deactivateCompany = async (companyId) => {
  const company = await findActiveCompanyById(companyId);

  company.isActive = false;
  await company.save();

  return company;
};

const reactivateCompany = async (companyId) => {
  const company = await findCompanyById(companyId);

  if (company.isActive) {
    throw new AppError("Company is already active.", 409);
  }

  const duplicate = await Company.findOne({
    _id: { $ne: company._id },
    name: {
      $regex: `^${escapeRegex(company.name)}$`,
      $options: "i",
    },
    isActive: true,
  });

  if (duplicate) {
    throw new AppError(
      "Another active company already uses this name. Update the company name before reactivating it.",
      409
    );
  }

  company.isActive = true;
  await company.save();

  return company;
};

const permanentlyDeleteCompany = async (companyId) => {
  ensureValidCompanyId(companyId);

  const session = await mongoose.startSession();

  let deletionSummary = {
    deletedJobs: 0,
    deletedApplications: 0,
    deletedNotifications: 0,
  };

  try {
    await session.withTransaction(async () => {
      const company = await Company.findById(companyId).session(session);

      if (!company) {
        throw new AppError("Company not found.", 404);
      }

      if (company.isActive) {
        throw new AppError(
          "Deactivate the company before permanently deleting it.",
          400
        );
      }

      const jobs = await Job.find({
        company: company._id,
      })
        .select("_id")
        .session(session);

      const jobIds = jobs.map((job) => job._id);

      const applications = await Application.find({
        job: { $in: jobIds },
      })
        .select("_id")
        .session(session);

      const applicationIds = applications.map(
        (application) => application._id
      );

      const notificationConditions = [];

      if (jobIds.length > 0) {
        notificationConditions.push({
          relatedJob: { $in: jobIds },
        });
      }

      if (applicationIds.length > 0) {
        notificationConditions.push({
          relatedApplication: { $in: applicationIds },
        });
      }

      let deletedNotifications = 0;

      if (notificationConditions.length > 0) {
        const notificationResult = await Notification.deleteMany(
          { $or: notificationConditions },
          { session }
        );

        deletedNotifications = notificationResult.deletedCount ?? 0;
      }

      const applicationResult = await Application.deleteMany(
        { job: { $in: jobIds } },
        { session }
      );

      const jobResult = await Job.deleteMany(
        { company: company._id },
        { session }
      );

      // Remove company assignments from placement officers.
      await User.updateMany(
        { company: company._id },
        { $set: { company: null } },
        { session }
      );

      await Company.deleteOne(
        { _id: company._id },
        { session }
      );

      deletionSummary = {
        deletedJobs: jobResult.deletedCount ?? 0,
        deletedApplications: applicationResult.deletedCount ?? 0,
        deletedNotifications,
      };
    });
  } finally {
    await session.endSession();
  }

  return deletionSummary;
};

const assignOfficerToCompany = async (
  companyId,
  officerId,
  action
) => {
  const company =
  action === "unassign"
    ? await findCompanyById(companyId)
    : await findActiveCompanyById(companyId);
    
  if (!mongoose.isValidObjectId(officerId)) {
    throw new AppError("A valid placement officer ID is required.", 400);
  }

  // Find the officer by ID and role, including inactive accounts.
  // Inactive accounts must still be manageable for unassignment.
  const officer = await User.findOne({
    _id: officerId,
    role: ROLES.PLACEMENT_OFFICER,
  });

  if (!officer) {
    throw new AppError("Placement officer not found.", 404);
  }

  const currentCompanyId = officer.company
    ? officer.company.toString()
    : null;

  const destinationCompanyId = company._id.toString();

  if (action === "assign") {
    if (!officer.isActive) {
      throw new AppError(
        "Only active placement officers can be assigned.",
        403
      );
    }

    if (currentCompanyId === destinationCompanyId) {
      throw new AppError(
        "This placement officer is already assigned to this company.",
        409
      );
    }

    if (currentCompanyId) {
      throw new AppError(
        "This placement officer is already assigned to another company. Use the transfer action instead.",
        409
      );
    }

    officer.company = company._id;
    await officer.save();

    return {
      officer,
      company,
      action: "assigned",
    };
  }

  if (action === "transfer") {
    if (!officer.isActive) {
      throw new AppError(
        "Only active placement officers can be transferred.",
        403
      );
    }

    if (!currentCompanyId) {
      throw new AppError(
        "This placement officer is not currently assigned to a company. Use assign instead.",
        409
      );
    }

    if (currentCompanyId === destinationCompanyId) {
      throw new AppError(
        "The placement officer is already assigned to this company.",
        409
      );
    }

    officer.company = company._id;
    await officer.save();

    return {
      officer,
      company,
      action: "transferred",
    };
  }

  if (action === "unassign") {
    if (!currentCompanyId) {
      throw new AppError(
        "This placement officer is not currently assigned to any company.",
        409
      );
    }

    if (currentCompanyId !== destinationCompanyId) {
      throw new AppError(
        "This placement officer is assigned to a different company.",
        409
      );
    }

    officer.company = null;
    await officer.save();

    return {
      officer,
      company,
      action: "unassigned",
    };
  }

  throw new AppError(
    "Action must be assign, transfer, or unassign.",
    400
  );
};

export default {
  createCompany,
  getCompanyById,
  listCompanies,
  listPlacementOfficers,
  updateCompany,
  deactivateCompany,
  reactivateCompany,
  permanentlyDeleteCompany,
  assignOfficerToCompany,
};
