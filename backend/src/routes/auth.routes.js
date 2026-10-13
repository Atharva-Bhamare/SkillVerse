import express from "express";

import * as authController from "../controllers/auth.controller.js";

import { authenticate } from "../middlewares/authenticate.middleware.js";
import validate from "../middlewares/validate.middleware.js";

import {
  registerValidator,
  loginValidator,
  changePasswordValidator,
} from "../validators/auth.validator.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/

router.post(
  "/register",
  registerValidator,
  validate,
  authController.register
);

router.post(
  "/login",
  loginValidator,
  validate,
  authController.login
);

router.post("/refresh", authController.refresh);

/*
|--------------------------------------------------------------------------
| Protected Routes
|--------------------------------------------------------------------------
*/

router.post(
  "/logout",
  authenticate,
  authController.logout
);

router.get(
  "/me",
  authenticate,
  authController.me
);

router.patch(
  "/change-password",
  authenticate,
  changePasswordValidator,
  validate,
  authController.changePassword
);

export default router;