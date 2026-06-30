import express from "express";

import {
  createProfile,
  getMyProfile,
  updateMyProfile,
} from "../controllers/student.controller.js";

import {
  validateStudentProfile,
  validateStudentUpdate,
} from "../validators/student.validator.js";

import protect from "../middlewares/authenticate.middleware.js";
import authorize from "../middlewares/authorize.middleware.js";

import { ROLES } from "../config/constants.js";

const router = express.Router();

router.post(
  "/",
  protect,
  authorize(ROLES.STUDENT),
  validateStudentProfile,
  createProfile
);

router.get(
  "/me",
  protect,
  authorize(ROLES.STUDENT),
  getMyProfile
);

router.patch(
  "/me",
  protect,
  authorize(ROLES.STUDENT),
  validateStudentUpdate,
  updateMyProfile
);

export default router;