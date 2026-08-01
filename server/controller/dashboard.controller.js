import { asyncHandler } from "../utils/asyncHandler.js";
import * as dashboardService from "../services/dashboard.service.js";

const DEFAULT_RECENT_ACTIVITY_LIMIT = 10;
const MAX_RECENT_ACTIVITY_LIMIT = 50;

export const getAdminSummary = asyncHandler(async (req, res) => {
  const summary = await dashboardService.getAdminSummary();

  res.status(200).json({ success: true, message: "Dashboard summary retrieved successfully.", data: summary });
});

export const getRecentActivity = asyncHandler(async (req, res) => {
  const requested = parseInt(req.query.limit, 10);
  const limit = Number.isNaN(requested)
    ? DEFAULT_RECENT_ACTIVITY_LIMIT
    : Math.min(Math.max(requested, 1), MAX_RECENT_ACTIVITY_LIMIT);

  const activity = await dashboardService.getRecentActivity(limit);

  res.status(200).json({ success: true, message: "Recent activity retrieved successfully.", data: activity });
});
