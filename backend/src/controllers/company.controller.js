
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
