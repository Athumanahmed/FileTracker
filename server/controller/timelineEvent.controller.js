import { asyncHandler } from "../utils/asyncHandler.js";
import * as timelineEventService from "../services/timelineEvent.service.js";

export const listTimeline = asyncHandler(async (req, res) => {
  const { items, meta } = await timelineEventService.listTimeline({ fileId: req.params.fileId, query: req.query });
  res.status(200).json({ success: true, message: "Timeline retrieved successfully.", data: items, meta });
});
