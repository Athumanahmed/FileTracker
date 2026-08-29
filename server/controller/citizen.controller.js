import { asyncHandler } from "../utils/asyncHandler.js";
import * as citizenService from "../services/citizen.service.js";

export const setSmsPreference = asyncHandler(async (req, res) => {
  const result = await citizenService.setSmsPreference({
    citizenId: req.params.id,
    enabled: req.body.smsNotificationsEnabled,
    actorId: req.user.userId,
    ipAddress: req.ip,
  });
  res.status(200).json({ success: true, message: "Citizen SMS preference updated.", data: result });
});
