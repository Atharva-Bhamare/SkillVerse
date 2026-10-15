
import { Router } from "express";

import {
  createApplication,
  getApplicationById,
  listApplications,
  updateApplicationStatus,
  withdrawApplication,
} from "../controllers/application.controller.js";

import {
  createApplicationValidator,
  applicationIdValidator,
  listApplicationsValidator,
  updateApplicationStatusValidator,
  withdrawApplicationValidator,
} from "../validators/application.validator.js";

import { authenticate } from "../middlewares/authenticate.middleware.js";
import authorize from "../middlewares/authorize.middleware.js";
import validate from "../middlewares/validate.middleware.js";

import { ROLES } from "../config/constants.js";

const router = Router();

// All application routes require authentication.
router.use(authenticate);

// Submit an application. Only students may apply.
router.post(
  "/",
  authorize(ROLES.STUDENT),
  createApplicationValidator,
  validate,
  createApplication
);

// List applications.
// Students see only their own applications through the service.
// Management roles can list applications across students.
router.get(
  "/",
  listApplicationsValidator,
  validate,
  listApplications
);

// Retrieve one application.
// Students can retrieve their own applications; management roles can
// retrieve applications across students.
router.get(
  "/:applicationId",
  applicationIdValidator,
  validate,
  getApplicationById
);

// Update application status. Only management roles may do this.
router.patch(
  "/:applicationId/status",
  authorize(ROLES.ADMIN, ROLES.PLACEMENT_OFFICER),
  updateApplicationStatusValidator,
  validate,
  updateApplicationStatus
);

// Withdraw an application. Only the owning student may withdraw it.
router.patch(
  "/:applicationId/withdraw",
  authorize(ROLES.STUDENT),
  withdrawApplicationValidator,
  validate,
  withdrawApplication
);

export default router;
