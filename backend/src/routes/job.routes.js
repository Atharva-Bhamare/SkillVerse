
import { Router } from "express";

import {
  createJob,
  getJobById,
  listJobs,
  updateJob,
  deactivateJob,
  reactivateJob,
  permanentlyDeleteJob,
} from "../controllers/job.controller.js";

import {
  createJobValidator,
  updateJobValidator,
  jobIdValidator,
  listJobsValidator,
} from "../validators/job.validator.js";

import { authenticate } from "../middlewares/authenticate.middleware.js";
import authorize from "../middlewares/authorize.middleware.js";
import validate from "../middlewares/validate.middleware.js";

import { ROLES } from "../config/constants.js";

const router = Router();

// All job routes require authentication.
router.use(authenticate);

// List and search jobs.
router.get(
  "/",
  listJobsValidator,
  validate,
  listJobs
);

// Retrieve a specific job.
router.get(
  "/:jobId",
  jobIdValidator,
  validate,
  getJobById
);

// Create a job.
router.post(
  "/",
  authorize(ROLES.ADMIN, ROLES.PLACEMENT_OFFICER),
  createJobValidator,
  validate,
  createJob
);

// Update a job.
router.patch(
  "/:jobId",
  authorize(ROLES.ADMIN, ROLES.PLACEMENT_OFFICER),
  updateJobValidator,
  validate,
  updateJob
);

// Soft-delete (deactivate) a job.
router.delete(
  "/:jobId",
  authorize(ROLES.ADMIN, ROLES.PLACEMENT_OFFICER),
  jobIdValidator,
  validate,
  deactivateJob
);

// Reactivate a previously deactivated job.
router.patch(
  "/:jobId/reactivate",
  authorize(ROLES.ADMIN, ROLES.PLACEMENT_OFFICER),
  jobIdValidator,
  validate,
  reactivateJob
);

// Permanently delete a job and its associated records.
router.delete(
  "/:jobId/permanent",
  authorize(ROLES.ADMIN),
  jobIdValidator,
  validate,
  permanentlyDeleteJob
);

export default router;
