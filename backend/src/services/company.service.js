
import mongoose from "mongoose";
import User from "../models/user.model.js";
import { ROLES } from "../config/constants.js";
import Company from "../models/company.model.js";
import AppError from "../utils/AppError.js";

const escapeRegex = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const ensureValidCompanyId = (companyId) => {
  if (!mongoose.isValidObjectId(companyId)) {
    throw new AppError("A valid company ID is required.", 400);
  }
};

const findActiveCompanyById = async (companyId) => {
  ensureValidCompanyId(companyId);

  const company = await Company.findOne({
    _id: companyId,
    isActive: true,
  });

  if (!company) {
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

  const company = await Company.create({
    name,
    description: companyData.description,
    industry: companyData.industry,
    website: companyData.website,
    location: companyData.location,
    contactEmail: companyData.contactEmail,
    contactPhone: companyData.contactPhone,
    createdBy: userId,
  });

  return company;
};

const getCompanyById = async (companyId) => {
  return findActiveCompanyById(companyId);
};

const listCompanies = async (filters = {}) => {
  const page = Math.max(Number(filters.page) || 1, 1);
  const limit = Math.min(Math.max(Number(filters.limit) || 10, 1), 100);
  const skip = (page - 1) * limit;

  const filter = {
    isActive: true,
  };

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

  return true;
};

const assignOfficerToCompany = async (
  companyId,
  officerId,
  action
) => {
  const company = await findActiveCompanyById(companyId);

  if (!mongoose.isValidObjectId(officerId)) {
    throw new AppError("A valid placement officer ID is required.", 400);
  }

  const officer = await User.findOne({
    _id: officerId,
    role: ROLES.PLACEMENT_OFFICER,
    isActive: true,
  });

  if (!officer) {
    throw new AppError("Active placement officer not found.", 404);
  }

  if (action === "assign") {
    officer.company = company._id;
    await officer.save();

    return {
      officer,
      company,
      action: "assigned",
    };
  }

  if (action === "unassign") {
    if (
      officer.company &&
      officer.company.toString() !== company._id.toString()
    ) {
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
    "Action must be either 'assign' or 'unassign'.",
    400
  );
};

export default {
  createCompany,
  getCompanyById,
  listCompanies,
  updateCompany,
  deactivateCompany,
  assignOfficerToCompany,
};
