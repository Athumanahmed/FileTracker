import { asyncHandler } from "../utils/asyncHandler.js";
import * as trackService from "../services/track.service.js";

export const trackFile = asyncHandler(async (req, res) => {
  const data = await trackService.getPublicTrackingView({
    trackingNumber: req.query.trackingNumber,
    phone: req.query.phone,
  });
  res.status(200).json({ success: true, message: "File status retrieved.", data });
});
