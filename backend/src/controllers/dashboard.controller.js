
import asyncHandler from "../utils/asyncHandler.js";
import * as dashboardService from "../services/dashboard.service.js";
import {
  buildStudentDashboardResponse,
} from "../transformers/dashboard.transformer.js";
import {
    buildPlacementDashboardResponse,
  } from "../transformers/dashboard.transformer.js";

export const getStudentDashboard = asyncHandler(
  async (req, res) => {
    const dashboard = await dashboardService.getStudentDashboard(
      req.user.id,
      req.user.role
    );

    res.status(200).json({
      success: true,
      data: buildStudentDashboardResponse(dashboard),
    });
  }
);

export const getPlacementDashboard = asyncHandler(
    async (req, res) => {
      const dashboard = await dashboardService.getPlacementDashboard(
        req.user.id,
        req.user.role
      );
  
      res.status(200).json({
        success: true,
        data: buildPlacementDashboardResponse(dashboard),
      });
    }
  );
  