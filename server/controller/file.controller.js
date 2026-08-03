import { asyncHandler } from "../utils/asyncHandler.js";
import * as fileService from "../services/file.service.js";

export const registerFile = asyncHandler(async (req, res) => {
  const payload = {
    ...req.body,
    citizen: req.body.citizen ? JSON.parse(req.body.citizen) : undefined,
  };

  const file = await fileService.registerFile({
    actorId: req.user.userId,
    payload,
    files: req.files || [],
    ipAddress: req.ip,
  });

  res.status(201).json({ success: true, message: "File registered successfully.", data: file });
});

export const getFile = asyncHandler(async (req, res) => {
  const file = await fileService.getFileById(req.params.id);
  res.status(200).json({ success: true, message: "File retrieved successfully.", data: file });
});

export const listFiles = asyncHandler(async (req, res) => {
  const { items, meta } = await fileService.listFiles({ query: req.query });
  res.status(200).json({ success: true, message: "Files retrieved successfully.", data: items, meta });
});
