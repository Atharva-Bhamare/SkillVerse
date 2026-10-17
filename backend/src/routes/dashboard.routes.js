
import { Router } from "express";
import * as dashboardController from "../controllers/dashboard.controller.js";
import { authenticate } from "../middlewares/authenticate.middleware.js";

const router = Router();

// Student dashboard
router.get(
  "/student",
  authenticate,
  dashboardController.getStudentDashboard
);

// Placement and admin dashboard
router.get(
  "/placement",
  authenticate,
  dashboardController.getPlacementDashboard
);

export default router;
