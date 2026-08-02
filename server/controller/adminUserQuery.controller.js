import { asyncHandler } from "../utils/asyncHandler.js";
import * as adminUserQueryService from "../services/adminUserQuery.service.js";

export const listUsers = asyncHandler(async (req, res) => {
  const { items, meta } = await adminUserQueryService.listUsersForAdmin({
    query: req.query,
    actorId: req.user.userId,
  });

  res.status(200).json({ success: true, message: "Users retrieved successfully.", data: items, meta });
});

export const getUserById = asyncHandler(async (req, res) => {
  const user = await adminUserQueryService.getUserByIdForAdmin(req.params.userId, req.user.userId);

  res.status(200).json({ success: true, message: "User retrieved successfully.", data: user });
});

export const getUserStats = asyncHandler(async (req, res) => {
  const stats = await adminUserQueryService.getUserStatsForAdmin({ actorId: req.user.userId });

  res.status(200).json({ success: true, message: "User statistics retrieved successfully.", data: stats });
});
