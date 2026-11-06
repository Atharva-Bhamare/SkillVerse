
import express from "express";

import * as companyController from "../controllers/company.controller.js";

import { authenticate } from "../middlewares/authenticate.middleware.js";
import authorize from "../middlewares/authorize.middleware.js";
import validate from "../middlewares/validate.middleware.js";

import { ROLES } from "../config/constants.js";

import {
  createCompanyValidator,
  updateCompanyValidator,
  companyIdValidator,
  listCompaniesValidator,
  assignOfficerValidator,
} from "../validators/company.validator.js";

const router = express.Router();

// Authenticate all company routes
router.use(authenticate);

// List companies
router.get(
  "/",
  listCompaniesValidator,
  validate,
  companyController.listCompanies
);

router.get(
  "/officers",
  authorize(ROLES.ADMIN),
  companyController.listPlacementOfficers
);

// Get company by ID
router.get(
  "/:companyId",
  companyIdValidator,
  validate,
  companyController.getCompanyById
);

// Create company (admin only)
router.post(
  "/",
  authorize(ROLES.ADMIN),
  createCompanyValidator,
  validate,
  companyController.createCompany
);

// Update company (admin only)
router.patch(
  "/:companyId",
  authorize(ROLES.ADMIN),
  updateCompanyValidator,
  validate,
  companyController.updateCompany
);

// Deactivate company (admin only)
router.patch(
  "/:companyId/deactivate",
  authorize(ROLES.ADMIN),
  companyIdValidator,
  validate,
  companyController.deactivateCompany
);

// Backward-compatible deactivation route
router.delete(
  "/:companyId",
  authorize(ROLES.ADMIN),
  companyIdValidator,
  validate,
  companyController.deactivateCompany
);

// Reactivate company (admin only)
router.patch(
  "/:companyId/reactivate",
  authorize(ROLES.ADMIN),
  companyIdValidator,
  validate,
  companyController.reactivateCompany
);

// Permanently delete company and associated records (admin only)
router.delete(
  "/:companyId/permanent",
  authorize(ROLES.ADMIN),
  companyIdValidator,
  validate,
  companyController.permanentlyDeleteCompany
);

// Assign or remove placement officers (admin only)
router.patch(
  "/:companyId/officers/:officerId",
  authorize(ROLES.ADMIN),
  assignOfficerValidator,
  validate,
  companyController.assignOfficerToCompany
);

export default router;
