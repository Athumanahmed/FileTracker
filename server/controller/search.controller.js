import { asyncHandler } from "../utils/asyncHandler.js";
import * as searchService from "../services/search.service.js";

export const globalSearch = asyncHandler(async (req, res) => {
  const results = await searchService.globalSearch(req.query.q, { limit: req.query.limit });
  res.status(200).json({ success: true, message: "Search results retrieved successfully.", data: results });
});
