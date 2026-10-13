
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
} from "../validators/company.validator.js";

const router = express.Router();

// All company routes require authentication.
router.use(authenticate);

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
  authorize(ROLES.ADMIN, ROLES.PLACEMENT_OFFICER),
  createCompanyValidator,
  validate,
  companyController.createCompany
);

router.patch(
  "/:companyId",
  authorize(ROLES.ADMIN, ROLES.PLACEMENT_OFFICER),
  updateCompanyValidator,
  validate,
  companyController.updateCompany
);

router.delete(
  "/:companyId",
  authorize(ROLES.ADMIN, ROLES.PLACEMENT_OFFICER),
  companyIdValidator,
  validate,
  companyController.deactivateCompany
);

export default router;
