import { asyncHandler } from "../utils/asyncHandler.js";
import * as fileMinuteService from "../services/fileMinute.service.js";

export const writeMinute = asyncHandler(async (req, res) => {
  const minute = await fileMinuteService.writeMinute({
    fileId: req.params.fileId,
    actorId: req.user.userId,
    payload: req.body,
    files: req.files || [],
    ipAddress: req.ip,
  });
  res.status(201).json({ success: true, message: "Minute recorded successfully.", data: minute });
});

export const replyToMinute = asyncHandler(async (req, res) => {
  const minute = await fileMinuteService.replyToMinute({
    parentMinuteId: req.params.id,
    actorId: req.user.userId,
    payload: req.body,
    files: req.files || [],
    ipAddress: req.ip,
  });
  res.status(201).json({ success: true, message: "Reply recorded successfully.", data: minute });
});

export const getMinute = asyncHandler(async (req, res) => {
  const minute = await fileMinuteService.getMinuteById(req.params.id);
  res.status(200).json({ success: true, message: "Minute retrieved successfully.", data: minute });
});

export const listFileMinutes = asyncHandler(async (req, res) => {
  const minutes = await fileMinuteService.listMinutesByFile(req.params.fileId);
  res.status(200).json({ success: true, message: "Decision history retrieved successfully.", data: minutes });
});

export const deleteMinute = asyncHandler(async (req, res) => {
  const minute = await fileMinuteService.deleteMinute({
    minuteId: req.params.id,
    actorId: req.user.userId,
    ipAddress: req.ip,
  });
  res.status(200).json({ success: true, message: "Minute deleted successfully.", data: minute });
});
