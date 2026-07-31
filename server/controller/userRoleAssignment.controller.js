import { asyncHandler } from "../utils/asyncHandler.js";
import * as userRoleAssignmentService from "../services/userRoleAssignment.service.js";

export const assignRole = asyncHandler(async (req, res) => {
  const result = await userRoleAssignmentService.assignRoleToUser({
    actorId: req.user.userId,
    targetUserId: req.params.userId,
    roleCode: req.body.roleCode,
    ipAddress: req.ip,
  });

  res.status(201).json({ success: true, message: "Role assigned to user successfully.", data: result });
});

export const removeRole = asyncHandler(async (req, res) => {
  const result = await userRoleAssignmentService.removeRoleFromUser({
    actorId: req.user.userId,
    targetUserId: req.params.userId,
    roleCode: req.params.roleCode.toUpperCase(),
    ipAddress: req.ip,
  });

  res.status(200).json({ success: true, message: "Role removed from user successfully.", data: result });
});
