import { body, validationResult } from "express-validator";
import AppError from "../utils/AppError.js";

export const validateStudentProfile = [
  body("headline")
    .trim()
    .notEmpty()
    .withMessage("Headline is required.")
    .isLength({ max: 100 })
    .withMessage("Headline cannot exceed 100 characters."),

  body("college")
    .trim()
    .notEmpty()
    .withMessage("College is required."),

  body("degree")
    .trim()
    .notEmpty()
    .withMessage("Degree is required."),

  body("specialization")
    .trim()
    .notEmpty()
    .withMessage("Specialization is required."),

  body("graduationYear")
    .isInt({ min: 2020, max: 2045 })
    .withMessage("Invalid graduation year."),

  body("cgpa")
    .optional()
    .isFloat({ min: 0, max: 10 })
    .withMessage("CGPA must be between 0 and 10."),

  body("skills")
    .optional()
    .isArray()
    .withMessage("Skills must be an array."),

  (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return next(
        new AppError(
          errors.array().map((err) => err.msg).join(" "),
          400
        )
      );
    }

    next();
  },
];

export const validateStudentUpdate = [
  body("headline")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Headline cannot exceed 100 characters."),

  body("bio")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Bio cannot exceed 500 characters."),

  body("college")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("College cannot be empty."),

  body("degree")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Degree cannot be empty."),

  body("specialization")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Specialization cannot be empty."),

  body("graduationYear")
    .optional()
    .isInt({ min: 2020, max: 2045 })
    .withMessage("Invalid graduation year."),

  body("cgpa")
    .optional()
    .isFloat({ min: 0, max: 10 })
    .withMessage("CGPA must be between 0 and 10."),

  body("skills")
    .optional()
    .isArray()
    .withMessage("Skills must be an array."),

  body("socialLinks")
    .optional()
    .isObject()
    .withMessage("Social links must be an object."),

  (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return next(
        new AppError(
          errors.array().map((e) => e.msg).join(" "),
          400
        )
      );
    }

    next();
  },
];