import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/AppError.js";
import * as fileAttachmentService from "../services/fileAttachment.service.js";

const REQUIRE_FILE_MESSAGE = 'No file was provided (expected multipart/form-data field "file")';

export const uploadAttachment = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError(400, REQUIRE_FILE_MESSAGE);

  const attachment = await fileAttachmentService.uploadAttachment({
    fileId: req.params.fileId,
    actorId: req.user.userId,
    title: req.body.title,
    attachmentType: req.body.attachmentType,
    uploadedFile: req.file,
    ipAddress: req.ip,
  });

  res.status(201).json({ success: true, message: "Attachment uploaded successfully.", data: attachment });
});

export const replaceAttachment = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError(400, REQUIRE_FILE_MESSAGE);

  const attachment = await fileAttachmentService.replaceAttachment({
    attachmentId: req.params.id,
    actorId: req.user.userId,
    uploadedFile: req.file,
    ipAddress: req.ip,
  });

  res.status(200).json({ success: true, message: "Attachment replaced successfully.", data: attachment });
});

export const getAttachment = asyncHandler(async (req, res) => {
  const attachment = await fileAttachmentService.getAttachmentById(req.params.id);
  res.status(200).json({ success: true, message: "Attachment retrieved successfully.", data: attachment });
});

export const listFileAttachments = asyncHandler(async (req, res) => {
  const attachments = await fileAttachmentService.listAttachmentsByFile(req.params.fileId);
  res.status(200).json({ success: true, message: "Attachments retrieved successfully.", data: attachments });
});

export const listVersions = asyncHandler(async (req, res) => {
  const versions = await fileAttachmentService.listVersions(req.params.id);
  res.status(200).json({ success: true, message: "Versions retrieved successfully.", data: versions });
});

const streamToResponse = (req, res, { stream, version }, disposition) => {
  res.setHeader("Content-Type", version.mimeType);
  res.setHeader("Content-Length", version.fileSizeBytes);
  res.setHeader("Content-Disposition", `${disposition}; filename="${encodeURIComponent(version.originalFileName)}"`);

  stream.on("error", (err) => {
    req.log?.error({ err }, "Attachment stream error");
    res.destroy(err);
  });

  stream.pipe(res);
};

export const downloadAttachment = asyncHandler(async (req, res) => {
  const result = await fileAttachmentService.downloadAttachment({
    attachmentId: req.params.id,
    versionId: req.params.versionId,
    actorId: req.user.userId,
    ipAddress: req.ip,
  });
  streamToResponse(req, res, result, "attachment");
});

export const previewAttachment = asyncHandler(async (req, res) => {
  const result = await fileAttachmentService.previewAttachment({
    attachmentId: req.params.id,
    actorId: req.user.userId,
    ipAddress: req.ip,
  });
  streamToResponse(req, res, result, "inline");
});

export const deleteAttachment = asyncHandler(async (req, res) => {
  const attachment = await fileAttachmentService.deleteAttachment({
    attachmentId: req.params.id,
    actorId: req.user.userId,
    ipAddress: req.ip,
  });
  res.status(200).json({ success: true, message: "Attachment deleted successfully.", data: attachment });
});
