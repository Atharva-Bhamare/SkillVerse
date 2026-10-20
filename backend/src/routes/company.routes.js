
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

// All company routes require authentication.
router.use(authenticate);

router.patch(
  "/:companyId/officers/:officerId",
  authorize(ROLES.ADMIN),
  assignOfficerValidator,
  validate,
  companyController.assignOfficerToCompany
);

// Read company information.
router.get(
  "/",
  listCompaniesValidator,
  validate,
  companyController.listCompanies
);

router.get(
  "/:companyId",
  companyIdValidator,
  validate,
  companyController.getCompanyById
);

// Only admins and placement officers can manage companies.
router.post(
  "/",
  authorize(ROLES.ADMIN),
  createCompanyValidator,
  validate,
  companyController.createCompany
);

router.patch(
  "/:companyId",
  authorize(ROLES.ADMIN),
  updateCompanyValidator,
  validate,
  companyController.updateCompany
);

router.delete(
  "/:companyId",
  authorize(ROLES.ADMIN),
  companyIdValidator,
  validate,
  companyController.deactivateCompany
);

export default router;
