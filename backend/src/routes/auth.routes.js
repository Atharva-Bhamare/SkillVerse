import express from "express";

import * as authController from "../controllers/auth.controller.js";

import { authenticate } from "../middlewares/authenticate.middleware.js";
import validate from "../middlewares/validate.middleware.js";

import {
  registerValidator,
  loginValidator,
  changePasswordValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
} from "../validators/auth.validator.js";

import {
  loginLimiter,
  registerLimiter,
  refreshLimiter,
  changePasswordLimiter,
  forgotPasswordLimiter,
  resetPasswordLimiter,
} from "../middlewares/rateLimit.middleware.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/

router.post(
  "/register",
  registerLimiter,
  registerValidator,
  validate,
  authController.register
);

router.post(
  "/login",
  loginLimiter,
  loginValidator,
  validate,
  authController.login
);

router.post(
  "/refresh",
  refreshLimiter,
  authController.refresh
);

router.post(
  "/forgot-password",
  forgotPasswordLimiter,
  forgotPasswordValidator,
  validate,
  authController.forgotPassword
);  

router.post(
  "/reset-password",
  resetPasswordLimiter,
  resetPasswordValidator,
  validate,
  authController.resetPassword
);

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
  changePasswordLimiter,
  changePasswordValidator,
  validate,
  authController.changePassword
);

export default router;