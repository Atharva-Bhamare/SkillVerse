
import asyncHandler from "../utils/asyncHandler.js";
import * as dashboardService from "../services/dashboard.service.js";

import {
  buildStudentDashboardResponse,
  buildPlacementDashboardResponse,
} from "../transformers/dashboard.transformer.js";

const getUserId = (req) => req.user.id ?? req.user._id;

// Student dashboard
export const getStudentDashboard = asyncHandler(
  async (req, res) => {
    const dashboard = await dashboardService.getStudentDashboard(
      getUserId(req),
      req.user.role
    );

    return res.status(200).json({
      success: true,
      data: buildStudentDashboardResponse(dashboard),
    });
  }
);

// Placement officer and admin dashboard
export const getPlacementDashboard = asyncHandler(
  async (req, res) => {
    const dashboard = await dashboardService.getPlacementDashboard(
      getUserId(req),
      req.user.role
    );

    return res.status(200).json({
      success: true,
      data: buildPlacementDashboardResponse(dashboard),
    });
  }
);
