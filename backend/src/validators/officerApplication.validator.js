
import { body, param, query } from "express-validator";

export const submitOfficerApplicationValidator = [
  body("fullName")
    .trim()
    .notEmpty()
    .withMessage("Full name is required.")
    .isLength({ min: 3, max: 50 })
    .withMessage("Full name must be between 3 and 50 characters."),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required.")
    .isEmail()
    .withMessage("Please provide a valid email.")
    .normalizeEmail(),

  body("password")
    .notEmpty()
    .withMessage("Password is required.")
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

  body("organizationName")
    .trim()
    .notEmpty()
    .withMessage("Organization name is required.")
    .isLength({ min: 2, max: 100 })
    .withMessage("Organization name must be between 2 and 100 characters."),

  body("designation")
    .trim()
    .notEmpty()
    .withMessage("Designation is required.")
    .isLength({ min: 2, max: 100 })
    .withMessage("Designation must be between 2 and 100 characters."),

  body("contactNumber")
    .trim()
    .notEmpty()
    .withMessage("Contact number is required.")
    .matches(/^\+?[0-9\s()-]{7,20}$/)
    .withMessage("Please provide a valid contact number."),

  body("reason")
    .trim()
    .notEmpty()
    .withMessage("Application reason is required.")
    .isLength({ min: 20, max: 1000 })
    .withMessage("Application reason must be between 20 and 1000 characters."),
];

export const resendVerificationValidator = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required.")
    .isEmail()
    .withMessage("Please provide a valid email.")
    .normalizeEmail(),
];

export const applicationIdValidator = [
    param("applicationId")
      .isMongoId()
      .withMessage("A valid application ID is required."),
  ];
  
  export const listOfficerApplicationsValidator = [
    query("status")
      .optional()
      .isIn(["pending", "approved", "rejected"])
      .withMessage("Status must be pending, approved or rejected."),
  
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer."),
  
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit must be between 1 and 100."),
  
    query("search")
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage("Search cannot exceed 100 characters."),
  ];
  
  export const rejectApplicationValidator = [
    ...applicationIdValidator,
  
    body("rejectionReason")
      .trim()
      .notEmpty()
      .withMessage("Rejection reason is required.")
      .isLength({ min: 5, max: 500 })
      .withMessage("Rejection reason must be between 5 and 500 characters."),
  ];
  