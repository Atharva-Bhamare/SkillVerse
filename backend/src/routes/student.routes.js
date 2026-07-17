import { Router } from "express";

import * as studentController from "../controllers/student.controller.js";

import {
  createStudentProfileValidator,
  updateStudentProfileValidator,
} from "../validators/student.validator.js";

import validate from "../middlewares/validate.middleware.js";

import { uploadImage } from "../middlewares/upload.middleware.js";

import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

/* =====================================================
   Student Profile Routes
===================================================== */

router.post(
  "/profile",
  authenticate,
  createStudentProfileValidator,
  validate,
  studentController.createStudentProfile
);

router.get(
  "/profile",
  authenticate,
  studentController.getStudentProfile
);

router.patch(
  "/profile",
  authenticate,
  updateStudentProfileValidator,
  validate,
  studentController.updateStudentProfile
);

router.patch(
  "/profile/avatar",
  authenticate,
  uploadImage,
  studentController.updateStudentAvatar
);

export default router;