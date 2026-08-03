import { asyncHandler } from "../utils/asyncHandler.js";
import * as fileMovementService from "../services/fileMovement.service.js";

export const listMovements = asyncHandler(async (req, res) => {
  const { items, meta } = await fileMovementService.listMovements({ fileId: req.params.fileId, query: req.query });
  res.status(200).json({ success: true, message: "Movement history retrieved successfully.", data: items, meta });
});
