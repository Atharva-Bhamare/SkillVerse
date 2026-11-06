
import companyService from "../services/company.service.js";

import {
  buildCompanyResponse,
  buildCompanyListResponse,
} from "../transformers/company.transformer.js";

import asyncHandler from "../utils/asyncHandler.js";

import {
  sendCreated,
  sendSuccess,
} from "../utils/apiResponse.js";

import { ROLES } from "../config/constants.js";

export const createCompany = asyncHandler(async (req, res) => {
  const company = await companyService.createCompany(
    req.body,
    req.user._id
  );

  return sendCreated(
    res,
    "Company created successfully.",
    buildCompanyResponse(company)
  );
});

export const getCompanyById = asyncHandler(async (req, res) => {
  const company = await companyService.getCompanyById(
    req.params.companyId
  );

  return sendSuccess(
    res,
    200,
    "Company retrieved successfully.",
    buildCompanyResponse(company)
  );
});

export const listCompanies = asyncHandler(async (req, res) => {
  // Only administrators can view inactive or all companies.
  if (
    req.query.isActive !== undefined &&
    req.query.isActive !== "" &&
    req.user.role !== ROLES.ADMIN
  ) {
    return sendSuccess(
      res,
      403,
      "Only administrators can view inactive companies."
    );
  }

  const result = await companyService.listCompanies(req.query);

  return sendSuccess(
    res,
    200,
    "Companies retrieved successfully.",
    {
      companies: buildCompanyListResponse(result.companies),
      pagination: result.pagination,
    }
  );
});

export const updateCompany = asyncHandler(async (req, res) => {
  const company = await companyService.updateCompany(
    req.params.companyId,
    req.body
  );

  return sendSuccess(
    res,
    200,
    "Company updated successfully.",
    buildCompanyResponse(company)
  );
});

export const deactivateCompany = asyncHandler(async (req, res) => {
  await companyService.deactivateCompany(req.params.companyId);

  return sendSuccess(
    res,
    200,
    "Company deactivated successfully."
  );
});

export const reactivateCompany = asyncHandler(async (req, res) => {
  const company = await companyService.reactivateCompany(
    req.params.companyId
  );

  return sendSuccess(
    res,
    200,
    "Company reactivated successfully.",
    buildCompanyResponse(company)
  );
});

export const permanentlyDeleteCompany = asyncHandler(
  async (req, res) => {
    const result = await companyService.permanentlyDeleteCompany(
      req.params.companyId
    );

    return sendSuccess(
      res,
      200,
      "Company and all associated jobs, applications, and notifications permanently deleted.",
      result
    );
  }
);

export const assignOfficerToCompany = asyncHandler(
  async (req, res) => {
    const result = await companyService.assignOfficerToCompany(
      req.params.companyId,
      req.params.officerId,
      req.body.action
    );

    return sendSuccess(
      res,
      200,
      `Placement officer ${result.action} successfully.`,
      {
        officer: {
          id: result.officer._id,
          fullName: result.officer.fullName,
          email: result.officer.email,
          role: result.officer.role,
          company: result.officer.company,
        },
        company: {
          id: result.company._id,
          name: result.company.name,
        },
      }
    );
  }
);

export const listPlacementOfficers = asyncHandler(async (req, res) => {
  const officers = await companyService.listPlacementOfficers();

  return sendSuccess(
    res,
    200,
    "Placement officers retrieved successfully.",
    { officers }
  );
});