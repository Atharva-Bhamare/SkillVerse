
import { body, param, query } from "express-validator";

import {
  stringRequired,
  stringOptional,
} from "./common.validator.js";

const EMPLOYMENT_TYPES = [
  "full-time",
  "part-time",
  "contract",
  "internship",
  "temporary",
];

const WORK_MODES = ["onsite", "remote", "hybrid"];

const JOB_STATUSES = ["draft", "open", "closed", "cancelled"];

const optionalJobId = param("jobId")
  .optional()
  .isMongoId()
  .withMessage("A valid job ID is required.");

export const createJobValidator = [
  stringRequired("title", "Job title")
    .isLength({ min: 3, max: 150 })
    .withMessage("Job title must be between 3 and 150 characters."),

  stringRequired("description", "Job description")
    .isLength({ min: 20, max: 10000 })
    .withMessage("Job description must be between 20 and 10000 characters."),

  body("responsibilities")
    .optional()
    .isArray({ max: 30 })
    .withMessage("Responsibilities must be an array with at most 30 items."),

  body("responsibilities.*")
    .optional()
    .isString()
    .withMessage("Each responsibility must be a string.")
    .trim()
    .notEmpty()
    .withMessage("Responsibilities cannot be empty.")
    .isLength({ max: 500 })
    .withMessage("Responsibilities cannot exceed 500 characters."),

  body("requirements")
    .optional()
    .isArray({ max: 30 })
    .withMessage("Requirements must be an array with at most 30 items."),

  body("requirements.*")
    .optional()
    .isString()
    .withMessage("Each requirement must be a string.")
    .trim()
    .notEmpty()
    .withMessage("Requirements cannot be empty.")
    .isLength({ max: 500 })
    .withMessage("Requirements cannot exceed 500 characters."),

  body("skills")
    .optional()
    .isArray({ max: 50 })
    .withMessage("Skills must be an array with at most 50 items."),

  body("skills.*")
    .optional()
    .isString()
    .withMessage("Each skill must be a string.")
    .trim()
    .notEmpty()
    .withMessage("Skills cannot be empty.")
    .isLength({ max: 50 })
    .withMessage("Each skill cannot exceed 50 characters."),

  body("company")
    .notEmpty()
    .withMessage("Company ID is required.")
    .isMongoId()
    .withMessage("A valid company ID is required."),

  body("employmentType")
    .notEmpty()
    .withMessage("Employment type is required.")
    .isIn(EMPLOYMENT_TYPES)
    .withMessage("Invalid employment type."),

  body("workMode")
    .notEmpty()
    .withMessage("Work mode is required.")
    .isIn(WORK_MODES)
    .withMessage("Invalid work mode."),

  stringOptional("location", "Location")
    .isLength({ max: 150 })
    .withMessage("Location cannot exceed 150 characters."),

  body("salary.min")
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .withMessage("Minimum salary must be a non-negative number.")
    .toFloat(),

  body("salary.max")
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .withMessage("Maximum salary must be a non-negative number.")
    .toFloat(),

  body("salary.currency")
    .optional()
    .isString()
    .withMessage("Salary currency must be a string.")
    .trim()
    .isLength({ min: 3, max: 3 })
    .withMessage("Salary currency must be a three-letter code.")
    .toUpperCase(),

  body("salary.isDisclosed")
    .optional()
    .isBoolean()
    .withMessage("Salary disclosure must be a boolean.")
    .toBoolean(),

  body("experience.minYears")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Minimum experience must be non-negative.")
    .toFloat(),

  body("experience.maxYears")
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .withMessage("Maximum experience must be non-negative.")
    .toFloat(),

  body("openings")
    .notEmpty()
    .withMessage("Number of openings is required.")
    .isInt({ min: 1, max: 10000 })
    .withMessage("Openings must be between 1 and 10000.")
    .toInt(),

  body("applicationDeadline")
    .notEmpty()
    .withMessage("Application deadline is required.")
    .isISO8601()
    .withMessage("Application deadline must be a valid date.")
    .toDate(),

  body("status")
    .optional()
    .isIn(JOB_STATUSES)
    .withMessage("Invalid job status."),
];

export const updateJobValidator = [
  optionalJobId,

  body("title")
    .optional()
    .isString()
    .withMessage("Job title must be a string.")
    .trim()
    .isLength({ min: 3, max: 150 })
    .withMessage("Job title must be between 3 and 150 characters."),

  body("description")
    .optional()
    .isString()
    .withMessage("Job description must be a string.")
    .trim()
    .isLength({ min: 20, max: 10000 })
    .withMessage("Job description must be between 20 and 10000 characters."),

  body("responsibilities")
    .optional()
    .isArray({ max: 30 })
    .withMessage("Responsibilities must be an array with at most 30 items."),

  body("responsibilities.*")
    .optional()
    .isString()
    .withMessage("Each responsibility must be a string.")
    .trim()
    .notEmpty()
    .withMessage("Responsibilities cannot be empty.")
    .isLength({ max: 500 })
    .withMessage("Responsibilities cannot exceed 500 characters."),

  body("requirements")
    .optional()
    .isArray({ max: 30 })
    .withMessage("Requirements must be an array with at most 30 items."),

  body("requirements.*")
    .optional()
    .isString()
    .withMessage("Each requirement must be a string.")
    .trim()
    .notEmpty()
    .withMessage("Requirements cannot be empty.")
    .isLength({ max: 500 })
    .withMessage("Requirements cannot exceed 500 characters."),

  body("skills")
    .optional()
    .isArray({ max: 50 })
    .withMessage("Skills must be an array with at most 50 items."),

  body("skills.*")
    .optional()
    .isString()
    .withMessage("Each skill must be a string.")
    .trim()
    .notEmpty()
    .withMessage("Skills cannot be empty.")
    .isLength({ max: 50 })
    .withMessage("Skills cannot exceed 50 characters."),

  body("company")
    .optional()
    .isMongoId()
    .withMessage("A valid company ID is required."),

  body("employmentType")
    .optional()
    .isIn(EMPLOYMENT_TYPES)
    .withMessage("Invalid employment type."),

  body("workMode")
    .optional()
    .isIn(WORK_MODES)
    .withMessage("Invalid work mode."),

  body("location")
    .optional()
    .isString()
    .withMessage("Location must be a string.")
    .trim()
    .isLength({ max: 150 })
    .withMessage("Location cannot exceed 150 characters."),

  body("salary.min")
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .withMessage("Minimum salary must be non-negative.")
    .toFloat(),

  body("salary.max")
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .withMessage("Maximum salary must be non-negative.")
    .toFloat(),

  body("salary.currency")
    .optional()
    .isString()
    .withMessage("Salary currency must be a string.")
    .trim()
    .isLength({ min: 3, max: 3 })
    .withMessage("Salary currency must be a three-letter code.")
    .toUpperCase(),

  body("salary.isDisclosed")
    .optional()
    .isBoolean()
    .withMessage("Salary disclosure must be a boolean.")
    .toBoolean(),

  body("experience.minYears")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Minimum experience must be non-negative.")
    .toFloat(),

  body("experience.maxYears")
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .withMessage("Maximum experience must be non-negative.")
    .toFloat(),

  body("openings")
    .optional()
    .isInt({ min: 1, max: 10000 })
    .withMessage("Openings must be between 1 and 10000.")
    .toInt(),

  body("applicationDeadline")
    .optional()
    .isISO8601()
    .withMessage("Application deadline must be a valid date.")
    .toDate(),

  body("status")
    .optional()
    .isIn(JOB_STATUSES)
    .withMessage("Invalid job status."),
];

export const jobIdValidator = [
  param("jobId")
    .isMongoId()
    .withMessage("A valid job ID is required."),
];

export const listJobsValidator = [
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

  query("search")
    .optional()
    .isString()
    .withMessage("Search must be a string.")
    .trim()
    .isLength({ max: 100 })
    .withMessage("Search cannot exceed 100 characters."),

  query("company")
    .optional()
    .isMongoId()
    .withMessage("A valid company ID is required."),

  query("employmentType")
    .optional()
    .isIn(EMPLOYMENT_TYPES)
    .withMessage("Invalid employment type."),

  query("workMode")
    .optional()
    .isIn(WORK_MODES)
    .withMessage("Invalid work mode."),

  query("location")
    .optional()
    .isString()
    .withMessage("Location must be a string.")
    .trim()
    .isLength({ max: 150 })
    .withMessage("Location cannot exceed 150 characters."),

  query("skills")
    .optional()
    .isString()
    .withMessage("Skills filter must be a comma-separated string.")
    .trim()
    .isLength({ max: 500 })
    .withMessage("Skills filter cannot exceed 500 characters."),

  query("status")
    .optional()
    .isIn(JOB_STATUSES)
    .withMessage("Invalid job status."),
];
