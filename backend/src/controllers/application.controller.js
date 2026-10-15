
import applicationService from "../services/application.service.js";
import {
  buildApplicationResponse,
  buildApplicationListResponse,
} from "../transformers/application.transformer.js";
import {
  sendSuccess,
  sendCreated,
} from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

export const createApplication = asyncHandler(async (req, res) => {
  const application = await applicationService.createApplication(
    req.body,
    req.user.id,
    req.user.role
  );

  return sendCreated(
    res,
    "Application submitted successfully.",
    buildApplicationResponse(application)
  );
});

export const getApplicationById = asyncHandler(async (req, res) => {
  const application = await applicationService.getApplicationById(
    req.params.applicationId,
    req.user.id,
    req.user.role
  );

  return sendSuccess(
    res,
    200,
    "Application retrieved successfully.",
    buildApplicationResponse(application)
  );
});

export const listApplications = asyncHandler(async (req, res) => {
  const result = await applicationService.listApplications(
    req.query,
    req.user.id,
    req.user.role
  );

  return sendSuccess(
    res,
    200,
    "Applications retrieved successfully.",
    {
      applications: buildApplicationListResponse(result.applications),
      pagination: result.pagination,
    }
  );
});

export const updateApplicationStatus = asyncHandler(
  async (req, res) => {
    const application = await applicationService.updateApplicationStatus(
      req.params.applicationId,
      req.body,
      req.user.id,
      req.user.role
    );

    return sendSuccess(
      res,
      200,
      "Application status updated successfully.",
      buildApplicationResponse(application)
    );
  }
);

export const withdrawApplication = asyncHandler(
  async (req, res) => {
    const application = await applicationService.withdrawApplication(
      req.params.applicationId,
      req.user.id,
      req.user.role
    );

    return sendSuccess(
      res,
      200,
      "Application withdrawn successfully.",
      buildApplicationResponse(application)
    );
  }
);
