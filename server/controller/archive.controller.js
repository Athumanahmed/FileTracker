import { asyncHandler } from "../utils/asyncHandler.js";
import * as archiveService from "../services/archive.service.js";

export const archiveFile = asyncHandler(async (req, res) => {
  const record = await archiveService.archiveFile({
    fileId: req.params.fileId,
    retentionYears: req.body.retentionYears ? Number(req.body.retentionYears) : undefined,
    storageLocation: req.body.storageLocation,
    remarks: req.body.remarks,
    actorId: req.user.userId,
    ipAddress: req.ip,
  });
  res.status(200).json({ success: true, message: "File archived successfully.", data: record });
});

export const restoreFile = asyncHandler(async (req, res) => {
  const record = await archiveService.restoreFile({
    fileId: req.params.fileId,
    remarks: req.body.remarks,
    actorId: req.user.userId,
    ipAddress: req.ip,
  });
  res.status(200).json({ success: true, message: "File restored successfully.", data: record });
});

export const getArchiveStatus = asyncHandler(async (req, res) => {
  const record = await archiveService.getArchiveStatus(req.params.fileId);
  res.status(200).json({ success: true, message: "Archive status retrieved successfully.", data: record });
});

export const listExpiredRetention = asyncHandler(async (req, res) => {
  const records = await archiveService.listExpiredRetention();
  res.status(200).json({ success: true, message: "Expired-retention records retrieved successfully.", data: records });
});
