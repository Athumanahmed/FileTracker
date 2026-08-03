import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/AppError.js";
import * as storageService from "./storage.service.js";

/**
 * Deliberately does not funnel through asyncHandler/errorHandler: a
 * MinIO outage is an expected infrastructure state for a health probe,
 * not an application bug, so it reports 503 with a body instead of a
 * generic 500.
 */
export const getStorageHealth = async (req, res) => {
  try {
    const health = await storageService.checkHealth();
    res.status(200).json({ success: true, message: "Storage is reachable.", data: health });
  } catch (err) {
    res.status(503).json({
      success: false,
      message: "Storage is unreachable.",
      data: { connected: false },
    });
  }
};

export const uploadObject = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError(400, "No file was provided (expected multipart/form-data field \"file\")");
  }

  const storageObject = await storageService.uploadObject({
    buffer: req.file.buffer,
    originalFileName: req.file.originalname,
    mimeType: req.file.mimetype,
    size: req.file.size,
    uploadedById: req.user.userId,
    context: req.body.context,
    ipAddress: req.ip,
  });

  res.status(201).json({ success: true, message: "File uploaded successfully.", data: storageObject });
});

export const getObjectMetadata = asyncHandler(async (req, res) => {
  const storageObject = await storageService.getMetadata(req.params.id);
  res.status(200).json({ success: true, message: "Storage object metadata retrieved successfully.", data: storageObject });
});

export const downloadObject = asyncHandler(async (req, res) => {
  const { stream, storageObject } = await storageService.getDownloadStream(req.params.id);

  res.setHeader("Content-Type", storageObject.mimeType);
  res.setHeader("Content-Length", storageObject.sizeBytes);
  res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(storageObject.originalFileName)}"`);

  stream.on("error", (err) => {
    // Headers are already sent by the time a mid-stream MinIO error can
    // occur, so this can only terminate the connection, not send a JSON error.
    req.log?.error({ err }, "Storage download stream error");
    res.destroy(err);
  });

  stream.pipe(res);
});

export const getPresignedUrl = asyncHandler(async (req, res) => {
  const result = await storageService.generatePresignedUrl({
    id: req.params.id,
    actorId: req.user.userId,
    ipAddress: req.ip,
    expirySeconds: req.query.expirySeconds ? Number(req.query.expirySeconds) : undefined,
  });

  res.status(200).json({ success: true, message: "Presigned URL generated successfully.", data: result });
});

export const deleteObject = asyncHandler(async (req, res) => {
  const storageObject = await storageService.deleteObject({
    id: req.params.id,
    actorId: req.user.userId,
    ipAddress: req.ip,
  });

  res.status(200).json({ success: true, message: "Storage object deleted successfully.", data: storageObject });
});
