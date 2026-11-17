import { body } from "express-validator";

import { stringRequired } from "./common.validator.js";

export const registerValidator = [
  stringRequired("fullName", "Full name"),
  stringRequired("email", "Email")
    .isEmail()
    .withMessage("Please provide a valid email.")
    .normalizeEmail(),

  stringRequired("password", "Password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long."),

  body("confirmPassword")
    .notEmpty()
    .withMessage("Confirm password is required.")
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Passwords do not match.");
      }
      return true;
    }),

  body("registrationToken")
    .notEmpty()
    .withMessage("Email verification is required.")
    .bail()
    .matches(/^[a-f0-9]{64}$/i)
    .withMessage("Invalid registration verification token."),

];

export const loginValidator = [
  stringRequired("email", "Email")
    .isEmail()
    .withMessage("Please provide a valid email.")
    .normalizeEmail(),

  stringRequired("password", "Password"),
];

export const forgotPasswordValidator = [
  stringRequired("email", "Email")
    .isEmail()
    .withMessage("Please provide a valid email.")
    .normalizeEmail(),
];

export const changePasswordValidator = [
  stringRequired("currentPassword", "Current password"),

  stringRequired("newPassword", "New password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long."),

  body("confirmPassword")
    .notEmpty()
    .withMessage("Confirm password is required.")
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error("Passwords do not match.");
      }
      return true;
    }),
];

export const resetPasswordValidator = [
  body("token")
    .notEmpty()
    .withMessage("Password reset token is required.")
    .bail()
    .matches(/^[a-f0-9]{64}$/i)
    .withMessage("Invalid password reset token."),

  stringRequired("newPassword", "New password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long."),

  body("confirmPassword")
    .notEmpty()
    .withMessage("Confirm password is required.")
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error("Passwords do not match.");
      }

      return true;
    }),
];

export const sendRegistrationOtpValidator = [
  stringRequired("email", "Email")
    .isEmail()
    .withMessage("Please provide a valid email.")
    .normalizeEmail(),
];

export const verifyRegistrationOtpValidator = [
  stringRequired("email", "Email")
    .isEmail()
    .withMessage("Please provide a valid email.")
    .normalizeEmail(),

  body("otp")
    .trim()
    .notEmpty()
    .withMessage("Verification code is required.")
    .bail()
    .matches(/^[A-Za-z0-9]{6}$/)
    .withMessage("Verification code must contain exactly 6 alphanumeric characters."),
];
