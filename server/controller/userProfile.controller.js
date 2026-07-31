import { asyncHandler } from "../utils/asyncHandler.js";
import * as userProfileService from "../services/userProfile.service.js";

export const updateOwnProfile = asyncHandler(async (req, res) => {
  const user = await userProfileService.updateOwnProfile({
    userId: req.user.userId,
    payload: req.body,
    ipAddress: req.ip,
  });

  res.status(200).json({ success: true, message: "Profile updated successfully.", data: user });
});
