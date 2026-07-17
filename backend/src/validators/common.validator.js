import { body } from "express-validator";

/* =====================================================
   String Validators
===================================================== */

export const stringRequired = (field, label) =>
  body(field)
    .notEmpty()
    .withMessage(`${label} is required.`)
    .bail()
    .isString()
    .withMessage(`${label} must be a string.`)
    .trim();

export const stringOptional = (field, label) =>
  body(field)
    .optional()
    .isString()
    .withMessage(`${label} must be a string.`)
    .trim();

/* =====================================================
   URL Validators
===================================================== */

export const urlRequired = (field, label) =>
  body(field)
    .notEmpty()
    .withMessage(`${label} is required.`)
    .bail()
    .isURL()
    .withMessage(`${label} must be a valid URL.`)
    .trim();

export const urlOptional = (field, label) =>
  body(field)
    .optional({ values: "falsy" })
    .isURL()
    .withMessage(`${label} must be a valid URL.`)
    .trim();

/* =====================================================
   Number Validators
===================================================== */

export const integerRequired = (field, label) =>
  body(field)
    .exists()
    .withMessage(`${label} is required.`)
    .bail()
    .isInt()
    .withMessage(`${label} must be an integer.`)
    .toInt();

export const integerOptional = (field, label) =>
  body(field)
    .optional()
    .isInt()
    .withMessage(`${label} must be an integer.`)
    .toInt();

export const floatRequired = (field, label) =>
  body(field)
    .exists()
    .withMessage(`${label} is required.`)
    .bail()
    .isFloat()
    .withMessage(`${label} must be a valid number.`)
    .toFloat();

export const floatOptional = (field, label) =>
  body(field)
    .optional()
    .isFloat()
    .withMessage(`${label} must be a valid number.`)
    .toFloat();

/* =====================================================
   Boolean Validators
===================================================== */

export const optionalBoolean = (field, label) =>
  body(field)
    .optional()
    .isBoolean()
    .withMessage(`${label} must be a boolean.`)
    .toBoolean();

/* =====================================================
   Array Validators
===================================================== */

export const arrayRequired = (field, label) =>
  body(field)
    .exists()
    .withMessage(`${label} is required.`)
    .bail()
    .isArray()
    .withMessage(`${label} must be an array.`);

export const arrayOptional = (field, label) =>
  body(field)
    .optional()
    .isArray()
    .withMessage(`${label} must be an array.`);

export const arrayStringItems = (field, label) =>
  body(`${field}.*`)
    .optional()
    .isString()
    .withMessage(`${label} must be a string.`)
    .trim()
    .notEmpty()
    .withMessage(`${label} cannot be empty.`);