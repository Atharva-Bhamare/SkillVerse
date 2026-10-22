import { Router } from "express";

import * as studentController from "../controllers/student.controller.js";

import {
  createStudentProfileValidator,
  updateStudentProfileValidator,
} from "../validators/student.validator.js";

import validate from "../middlewares/validate.middleware.js";

import {
  uploadImage,
  uploadDocument,
} from "../middlewares/upload.middleware.js";

import { authenticate } from "../middlewares/authenticate.middleware.js";
import authorize from "../middlewares/authorize.middleware.js";

const router = Router();

/* =====================================================
   Student Profile Routes
===================================================== */

// Create student profile
router.post(
  "/profile",
  authenticate,
  authorize("student"),
  createStudentProfileValidator,
  validate,
  studentController.createStudentProfile
);

// Get student profile
router.get(
  "/profile",
  authenticate,
  authorize("student"),
  studentController.getStudentProfile
);

// Update student profile
router.patch(
  "/profile",
  authenticate,
  authorize("student"),
  updateStudentProfileValidator,
  validate,
  studentController.updateStudentProfile
);

// Update student avatar
router.patch(
  "/profile/avatar",
  authenticate,
  authorize("student"),
  uploadImage,
  studentController.updateStudentAvatar
);

// Update student resume
router.patch(
  "/profile/resume",
  authenticate,
  authorize("student"),
  uploadDocument,
  studentController.updateStudentResume
);

export default router;