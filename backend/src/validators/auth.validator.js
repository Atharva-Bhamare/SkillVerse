import { body, validationResult } from "express-validator";

import { ROLES } from "../config/constants.js";
import AppError from "../utils/AppError.js";

export const validateRegister = [
  body("fullName")
    .trim()
    .notEmpty()
    .withMessage("Full name is required.")
    .isLength({ min: 3, max: 50 })
    .withMessage("Full name must be between 3 and 50 characters."),

    body("email")
    .trim()
    .isEmail()
    .withMessage("Please provide a valid email address.")
    .normalizeEmail()
    .isLength({ max: 100 })
    .withMessage("Email cannot exceed 100 characters."),

    body("password")
    .isLength({ min: 8, max: 32 })
    .withMessage("Password must be between 8 and 32 characters.")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&^#()_\-+=])[A-Za-z\d@$!%*?&^#()_\-+=]{8,32}$/)
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character."
    ),

  body("role")
    .optional()
    .isIn(Object.values(ROLES))
    .withMessage("Invalid user role."),

  (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const messages = errors.array().map((error) => error.msg);

      return next(new AppError(messages.join(" "), 400));
    }

    next();
  },
];