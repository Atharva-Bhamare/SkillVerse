
import { body, param, query } from "express-validator";

import {
  stringRequired,
  stringOptional,
} from "./common.validator.js";

const optionalCompanyId = param("companyId")
  .optional()
  .isMongoId()
  .withMessage("A valid company ID is required.");

export const createCompanyValidator = [
  stringRequired("name", "Company name")
    .isLength({ min: 2, max: 100 })
    .withMessage("Company name must be between 2 and 100 characters."),

  stringOptional("description", "Description")
    .isLength({ max: 2000 })
    .withMessage("Description cannot exceed 2000 characters."),

  stringOptional("industry", "Industry")
    .isLength({ max: 100 })
    .withMessage("Industry cannot exceed 100 characters."),

  body("website")
    .optional({ checkFalsy: true })
    .isURL({ protocols: ["http", "https"], require_protocol: true })
    .withMessage("Please provide a valid HTTP or HTTPS website."),

  stringOptional("location", "Location")
    .isLength({ max: 150 })
    .withMessage("Location cannot exceed 150 characters."),

  body("contactEmail")
    .optional({ checkFalsy: true })
    .isEmail()
    .withMessage("Please provide a valid company contact email.")
    .normalizeEmail(),

  stringOptional("contactPhone", "Contact phone")
    .isLength({ max: 20 })
    .withMessage("Contact phone cannot exceed 20 characters."),
];

export const updateCompanyValidator = [
  optionalCompanyId,

  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Company name cannot be empty.")
    .isLength({ min: 2, max: 100 })
    .withMessage("Company name must be between 2 and 100 characters."),

  body("description")
    .optional()
    .isString()
    .withMessage("Description must be a string.")
    .trim()
    .isLength({ max: 2000 })
    .withMessage("Description cannot exceed 2000 characters."),

  body("industry")
    .optional()
    .isString()
    .withMessage("Industry must be a string.")
    .trim()
    .isLength({ max: 100 })
    .withMessage("Industry cannot exceed 100 characters."),

  body("website")
    .optional({ checkFalsy: true })
    .isURL({ protocols: ["http", "https"], require_protocol: true })
    .withMessage("Please provide a valid HTTP or HTTPS website."),

  body("location")
    .optional()
    .isString()
    .withMessage("Location must be a string.")
    .trim()
    .isLength({ max: 150 })
    .withMessage("Location cannot exceed 150 characters."),

  body("contactEmail")
    .optional({ checkFalsy: true })
    .isEmail()
    .withMessage("Please provide a valid company contact email.")
    .normalizeEmail(),

  body("contactPhone")
    .optional()
    .isString()
    .withMessage("Contact phone must be a string.")
    .trim()
    .isLength({ max: 20 })
    .withMessage("Contact phone cannot exceed 20 characters."),
];

export const companyIdValidator = [
  param("companyId")
    .isMongoId()
    .withMessage("A valid company ID is required."),
];

export const listCompaniesValidator = [
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

  query("industry")
    .optional()
    .isString()
    .withMessage("Industry must be a string.")
    .trim()
    .isLength({ max: 100 })
    .withMessage("Industry cannot exceed 100 characters."),

  query("location")
    .optional()
    .isString()
    .withMessage("Location must be a string.")
    .trim()
    .isLength({ max: 150 })
    .withMessage("Location cannot exceed 150 characters."),
];
