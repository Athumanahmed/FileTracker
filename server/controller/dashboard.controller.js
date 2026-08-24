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

export const getAuditLogs = asyncHandler(async (req, res) => {
  const { items, meta } = await dashboardService.listAuditLogsForAdmin(req.query);

  res.status(200).json({ success: true, message: "Audit logs retrieved successfully.", data: items, meta });
});

export const getAuditLogEntityOptions = asyncHandler(async (req, res) => {
  const entities = await dashboardService.getAuditLogEntityOptions();

  res.status(200).json({ success: true, message: "Audit log entity options retrieved successfully.", data: entities });
});

export const getScopedSummary = asyncHandler(async (req, res) => {
  const summary = await dashboardService.getScopedSummary(req.user.userId);

  res
    .status(200)
    .json({ success: true, message: "Scoped dashboard summary retrieved successfully.", data: summary });
});

export const getScopedRecentActivity = asyncHandler(async (req, res) => {
  const requested = parseInt(req.query.limit, 10);
  const limit = Number.isNaN(requested)
    ? DEFAULT_RECENT_ACTIVITY_LIMIT
    : Math.min(Math.max(requested, 1), MAX_RECENT_ACTIVITY_LIMIT);

  const activity = await dashboardService.getScopedRecentActivity(req.user.userId, limit);

  res
    .status(200)
    .json({ success: true, message: "Scoped recent activity retrieved successfully.", data: activity });
});
