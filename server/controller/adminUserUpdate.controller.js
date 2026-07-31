import { asyncHandler } from "../utils/asyncHandler.js";
import * as adminUserUpdateService from "../services/adminUserUpdate.service.js";

export const updateUserByAdmin = asyncHandler(async (req, res) => {
  const user = await adminUserUpdateService.updateUserByAdmin({
    actorId: req.user.userId,
    targetUserId: req.params.userId,
    payload: req.body,
    ipAddress: req.ip,
  });

  res.status(200).json({ success: true, message: "User updated successfully.", data: user });
});
