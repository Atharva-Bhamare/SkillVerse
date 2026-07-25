import { body } from "express-validator";

import {
  stringRequired,
  stringOptional,
} from "./common.validator.js";

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

  stringOptional("role", "Role"),
];

export const loginValidator = [
  stringRequired("email", "Email")
    .isEmail()
    .withMessage("Please provide a valid email.")
    .normalizeEmail(),

  stringRequired("password", "Password"),
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