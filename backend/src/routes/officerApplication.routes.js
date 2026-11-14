
import express from "express";

import * as officerApplicationController from "../controllers/officerApplication.controller.js";
import { authenticate } from "../middlewares/authenticate.middleware.js";
import authorize from "../middlewares/authorize.middleware.js";
import { ROLES } from "../config/constants.js";
import validate from "../middlewares/validate.middleware.js";

import {
  officerApplicationLimiter,
  emailVerificationLimiter,
  resendVerificationLimiter,
} from "../middlewares/rateLimit.middleware.js";

import {
  submitOfficerApplicationValidator,
  resendVerificationValidator,
  applicationIdValidator,
  listOfficerApplicationsValidator,
  rejectApplicationValidator,
} from "../validators/officerApplication.validator.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Public Placement Officer Application Routes
|--------------------------------------------------------------------------
*/

// Submit a new Placement Officer application.
router.post(
  "/",
  officerApplicationLimiter,
  submitOfficerApplicationValidator,
  validate,
  officerApplicationController.submitApplication
);

// Verify applicant email address.
router.get(
  "/verify-email",
  emailVerificationLimiter,
  officerApplicationController.verifyEmail
);

// Resend verification email.
router.post(
  "/resend-verification",
  resendVerificationLimiter,
  resendVerificationValidator,
  validate,
  officerApplicationController.resendVerification
);

/*
|--------------------------------------------------------------------------
| Admin Placement Officer Application Management
|--------------------------------------------------------------------------
*/

// List applications.
router.get(
  "/",
  authenticate,
  authorize(ROLES.ADMIN),
  listOfficerApplicationsValidator,
  validate,
  officerApplicationController.listApplications
);

// Retrieve application details.
router.get(
  "/:applicationId",
  authenticate,
  authorize(ROLES.ADMIN),
  applicationIdValidator,
  validate,
  officerApplicationController.getApplicationById
);

// Approve application.
router.patch(
  "/:applicationId/approve",
  authenticate,
  authorize(ROLES.ADMIN),
  applicationIdValidator,
  validate,
  officerApplicationController.approveApplication
);

// Reject application.
router.patch(
  "/:applicationId/reject",
  authenticate,
  authorize(ROLES.ADMIN),
  rejectApplicationValidator,
  validate,
  officerApplicationController.rejectApplication
);

export default router;
