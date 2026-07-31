import { asyncHandler } from "../utils/asyncHandler.js";
import * as userPasswordAdminService from "../services/userPasswordAdmin.service.js";

export const resetPasswordByAdmin = asyncHandler(async (req, res) => {
  const { username, newPassword } = await userPasswordAdminService.resetPasswordByAdmin({
    actorId: req.user.userId,
    targetUserId: req.params.userId,
    ipAddress: req.ip,
  });

  res.status(200).json({
    success: true,
    message: "Password reset successfully.",
    data: {
      username,
      // Shown exactly once -- the admin must relay this to the user out
      // of band; it cannot be retrieved again after this response.
      newPassword,
    },
  });
});
