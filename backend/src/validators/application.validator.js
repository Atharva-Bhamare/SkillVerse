
import { body, param, query } from "express-validator";
import {
  stringOptional,
} from "./common.validator.js";

export const createApplicationValidator = [
  body("job")
    .trim()
    .notEmpty()
    .withMessage("Job ID is required.")
    .bail()
    .isMongoId()
    .withMessage("Job ID must be a valid MongoDB ID."),

  body("resume")
    .optional({ nullable: true })
    .isString()
    .withMessage("Resume must be a string.")
    .bail()
    .trim()
    .isLength({ max: 2048 })
    .withMessage("Resume URL cannot exceed 2048 characters."),

  body("coverLetter")
    .optional()
    .isString()
    .withMessage("Cover letter must be a string.")
    .bail()
    .trim()
    .isLength({ max: 5000 })
    .withMessage("Cover letter cannot exceed 5000 characters."),

  // Student identity and application status are assigned by the server.
];

export const applicationIdValidator = [
  param("applicationId")
    .isMongoId()
    .withMessage("Application ID must be a valid MongoDB ID."),
];

export const listApplicationsValidator = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer.")
    .toInt(),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100.")
    .toInt(),

  query("status")
    .optional()
    .isIn([
      "pending",
      "reviewing",
      "shortlisted",
      "rejected",
      "accepted",
      "withdrawn",
    ])
    .withMessage("Invalid application status."),

  query("job")
    .optional()
    .isMongoId()
    .withMessage("Job ID must be a valid MongoDB ID."),
];

export const updateApplicationStatusValidator = [
  param("applicationId")
    .isMongoId()
    .withMessage("Application ID must be a valid MongoDB ID."),

  body("status")
    .notEmpty()
    .withMessage("Application status is required.")
    .bail()
    .isIn([
      "reviewing",
      "shortlisted",
      "rejected",
      "accepted",
    ])
    .withMessage("Invalid application status update."),
];

export const withdrawApplicationValidator = [
  param("applicationId")
    .isMongoId()
    .withMessage("Application ID must be a valid MongoDB ID."),
];

export const applicationJobIdValidator = [
  param("jobId")
    .isMongoId()
    .withMessage("Job ID must be a valid MongoDB ID."),
];
