
import officerApplicationService from "../services/officerApplication.service.js";

import asyncHandler from "../utils/asyncHandler.js";
import { sendCreated, sendSuccess } from "../utils/apiResponse.js";

export const submitApplication = asyncHandler(async (req, res) => {
  const result = await officerApplicationService.submitApplication(req.body);

  const message = result.emailSent
    ? "Placement Officer application submitted successfully. Please verify your email."
    : "Application submitted, but the verification email could not be sent. Please request a new verification email.";

  return sendCreated(res, message, result);
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.query;

  const result =
    await officerApplicationService.verifyApplicationEmail(token);

  return sendSuccess(
    res,
    200,
    result.message,
    {
      emailVerified: result.emailVerified,
      status: result.status,
    }
  );
});

export const resendVerification = asyncHandler(async (req, res) => {
  const result =
    await officerApplicationService.resendVerificationEmail(req.body.email);

  return sendSuccess(
    res,
    200,
    result.message,
    {
      emailSent: result.emailSent ?? null,
    }
  );
});

export const listApplications = asyncHandler(async (req, res) => {
  const result =
    await officerApplicationService.listApplications(req.query);

  return sendSuccess(
    res,
    200,
    "Placement Officer applications retrieved successfully.",
    result
  );
});

export const getApplicationById = asyncHandler(async (req, res) => {
  const application =
    await officerApplicationService.getApplicationById(
      req.params.applicationId
    );

  return sendSuccess(
    res,
    200,
    "Placement Officer application retrieved successfully.",
    { application }
  );
});

export const approveApplication = asyncHandler(async (req, res) => {
  const result =
    await officerApplicationService.reviewApplication(
      req.params.applicationId,
      req.user._id,
      "approved"
    );

  return sendSuccess(
    res,
    200,
    result.emailSent
      ? "Placement Officer application approved successfully."
      : "Application approved, but the notification email could not be sent.",
    result
  );
});

export const rejectApplication = asyncHandler(async (req, res) => {
  const result =
    await officerApplicationService.reviewApplication(
      req.params.applicationId,
      req.user._id,
      "rejected",
      req.body.rejectionReason
    );

  return sendSuccess(
    res,
    200,
    result.emailSent
      ? "Placement Officer application rejected successfully."
      : "Application rejected, but the notification email could not be sent.",
    result
  );
});
