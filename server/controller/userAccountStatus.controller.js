import { asyncHandler } from "../utils/asyncHandler.js";
import * as userAccountStatusService from "../services/userAccountStatus.service.js";

export const activateUser = asyncHandler(async (req, res) => {
  const user = await userAccountStatusService.activateUser({
    actorId: req.user.userId,
    targetUserId: req.params.userId,
    ipAddress: req.ip,
  });

  res.status(200).json({ success: true, message: "User activated successfully.", data: user });
});

export const deactivateUser = asyncHandler(async (req, res) => {
  const user = await userAccountStatusService.deactivateUser({
    actorId: req.user.userId,
    targetUserId: req.params.userId,
    ipAddress: req.ip,
  });

  res.status(200).json({ success: true, message: "User deactivated successfully.", data: user });
});

export const lockUser = asyncHandler(async (req, res) => {
  const user = await userAccountStatusService.lockUser({
    actorId: req.user.userId,
    targetUserId: req.params.userId,
    ipAddress: req.ip,
  });

  res.status(200).json({ success: true, message: "User locked successfully.", data: user });
});

export const unlockUser = asyncHandler(async (req, res) => {
  const user = await userAccountStatusService.unlockUser({
    actorId: req.user.userId,
    targetUserId: req.params.userId,
    ipAddress: req.ip,
  });

  res.status(200).json({ success: true, message: "User unlocked successfully.", data: user });
});
