import { AppError } from "../utils/AppError.js";
import { AUDIT_ACTIONS } from "../utils/auditActions.js";
import { publish } from "../utils/eventBus.js";
import * as authRepository from "../repositories/auth.repository.js";
import * as fileAttachmentRepository from "../repositories/fileAttachment.repository.js";
import * as fileActivityRepository from "../repositories/fileActivity.repository.js";
import * as fileRepository from "../repositories/file.repository.js";
import * as storageService from "../storage/storage.service.js";
import { assertFileNotArchived } from "./fileOwnership.service.js";

// Kept narrow and browser-renderable -- anything else (docx, xlsx, ...) is
// still downloadable, just not inline-previewable.
const PREVIEWABLE_MIME_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp", "text/plain"];

const sanitizeVersion = (version) =>
  version && {
    id: version.id,
    versionNumber: version.versionNumber,
    originalFileName: version.originalFileName,
    mimeType: version.mimeType,
    fileSizeBytes: Number(version.fileSizeBytes),
    checksum: version.checksum,
    uploadedById: version.uploadedById,
    createdAt: version.createdAt,
  };

const sanitize = (attachment) => ({
  id: attachment.id,
  fileId: attachment.fileId,
  minuteId: attachment.minuteId,
  title: attachment.title,
  attachmentType: attachment.attachmentType,
  currentVersion: sanitizeVersion(attachment.currentVersion),
  createdAt: attachment.createdAt,
  updatedAt: attachment.updatedAt,
});

const logAudit = ({ actorId, action, entityId, metadata, ipAddress }) =>
  authRepository.createAuditLog({
    userId: actorId,
    action,
    entity: "FileAttachment",
    entityId,
    description: `${action} (${entityId})`,
    metadata: metadata ?? null,
    ipAddress,
  });

const assertFileExists = async (fileId) => {
  const file = await fileRepository.findById(fileId);
  if (!file) throw new AppError(404, "File not found");
  return file;
};

const assertAttachmentExists = async (id) => {
  const attachment = await fileAttachmentRepository.findById(id);
  if (!attachment) throw new AppError(404, "Attachment not found");
  return attachment;
};

/** Same upload-then-persist-then-compensate-on-failure shape as file.service.js#registerFile. */
const uploadAndAttachVersion = async ({ attachmentId, uploadedFile, actorId, ipAddress }) => {
  const uploaded = await storageService.uploadObject({
    buffer: uploadedFile.buffer,
    originalFileName: uploadedFile.originalname,
    mimeType: uploadedFile.mimetype,
    size: uploadedFile.size,
    uploadedById: actorId,
    context: "FILE_ATTACHMENT",
    ipAddress,
  });

  try {
    return await fileAttachmentRepository.addVersion({
      attachmentId,
      versionData: {
        storageBucket: uploaded.bucket,
        storageKey: uploaded.objectKey,
        originalFileName: uploaded.originalFileName,
        mimeType: uploaded.mimeType,
        fileSizeBytes: BigInt(uploaded.sizeBytes),
        checksum: uploaded.checksum,
        uploadedById: actorId,
      },
    });
  } catch (err) {
    await storageService.deleteObject({ id: uploaded.id, actorId, ipAddress }).catch(() => {});
    throw err;
  }
};

// minuteId is optional -- set when a Minute (Phase 5) attaches supporting
// evidence to itself; omitted for a plain file-level attachment.
export const uploadAttachment = async ({ fileId, minuteId, actorId, title, attachmentType, uploadedFile, ipAddress }) => {
  const file = await assertFileExists(fileId);
  assertFileNotArchived(file);

  const attachment = await fileAttachmentRepository.create({
    fileId,
    minuteId: minuteId || null,
    title: title || uploadedFile.originalname,
    attachmentType: attachmentType || "DOCUMENT",
  });

  let updated;
  try {
    updated = await uploadAndAttachVersion({ attachmentId: attachment.id, uploadedFile, actorId, ipAddress });
  } catch (err) {
    // The attachment shell has no version yet -- remove it rather than
    // leaving a version-less row behind.
    await fileAttachmentRepository.softDelete(attachment.id, actorId).catch(() => {});
    throw err;
  }

  await logAudit({
    actorId,
    action: AUDIT_ACTIONS.ATTACHMENT_UPLOADED,
    entityId: updated.id,
    metadata: { fileId, versionId: updated.currentVersionId },
    ipAddress,
  });

  publish({
    type: "ATTACHMENT_UPLOADED",
    fileId,
    actorId,
    sourceType: "FileAttachment",
    sourceId: updated.id,
    title: "Attachment uploaded",
    description: updated.title,
  });

  return sanitize(updated);
};

/**
 * A replace that uploads byte-for-byte the same content as the current
 * version is rejected -- the checksum comparison is what makes storing a
 * checksum on every version actually useful, not just an idle audit field.
 */
export const replaceAttachment = async ({ attachmentId, actorId, uploadedFile, ipAddress }) => {
  const attachment = await assertAttachmentExists(attachmentId);
  assertFileNotArchived(await assertFileExists(attachment.fileId));

  const uploaded = await storageService.uploadObject({
    buffer: uploadedFile.buffer,
    originalFileName: uploadedFile.originalname,
    mimeType: uploadedFile.mimetype,
    size: uploadedFile.size,
    uploadedById: actorId,
    context: "FILE_ATTACHMENT",
    ipAddress,
  });

  if (attachment.currentVersion?.checksum === uploaded.checksum) {
    await storageService.deleteObject({ id: uploaded.id, actorId, ipAddress }).catch(() => {});
    throw new AppError(409, "This file is identical to the current version -- no new version was created");
  }

  let updated;
  try {
    updated = await fileAttachmentRepository.addVersion({
      attachmentId,
      versionData: {
        storageBucket: uploaded.bucket,
        storageKey: uploaded.objectKey,
        originalFileName: uploaded.originalFileName,
        mimeType: uploaded.mimeType,
        fileSizeBytes: BigInt(uploaded.sizeBytes),
        checksum: uploaded.checksum,
        uploadedById: actorId,
      },
    });
  } catch (err) {
    await storageService.deleteObject({ id: uploaded.id, actorId, ipAddress }).catch(() => {});
    throw err;
  }

  await logAudit({
    actorId,
    action: AUDIT_ACTIONS.ATTACHMENT_REPLACED,
    entityId: attachmentId,
    metadata: { newVersionId: updated.currentVersionId, versionNumber: updated.currentVersion.versionNumber },
    ipAddress,
  });

  publish({
    type: "ATTACHMENT_REPLACED",
    fileId: updated.fileId,
    actorId,
    sourceType: "FileAttachment",
    sourceId: attachmentId,
    title: "Attachment replaced",
    description: `${updated.title} (v${updated.currentVersion.versionNumber})`,
  });

  return sanitize(updated);
};

export const getAttachmentById = async (id) => sanitize(await assertAttachmentExists(id));

export const listAttachmentsByFile = async (fileId) => {
  await assertFileExists(fileId);
  const attachments = await fileAttachmentRepository.findByFileId(fileId);
  return attachments.map(sanitize);
};

export const listVersions = async (attachmentId) => {
  await assertAttachmentExists(attachmentId);
  const versions = await fileAttachmentRepository.findVersions(attachmentId);
  return versions.map(sanitizeVersion);
};

const resolveVersionForStreaming = async (attachmentId, versionId) => {
  const attachment = await assertAttachmentExists(attachmentId);

  const version = versionId
    ? await fileAttachmentRepository.findVersionById(attachmentId, versionId)
    : attachment.currentVersion;

  if (!version) throw new AppError(404, "Version not found");
  return { attachment, version };
};

export const downloadAttachment = async ({ attachmentId, versionId, actorId, ipAddress }) => {
  const { attachment, version } = await resolveVersionForStreaming(attachmentId, versionId);
  const stream = await storageService.getStreamByLocation(version.storageBucket, version.storageKey);

  await fileActivityRepository
    .record({
      fileId: attachment.fileId,
      userId: actorId ?? null,
      activityType: "DOWNLOAD",
      ipAddress: ipAddress ?? null,
      metadata: { attachmentId, versionId: version.id, versionNumber: version.versionNumber },
    })
    .catch(() => {});

  return { stream, version: sanitizeVersion(version) };
};

export const previewAttachment = async ({ attachmentId, actorId, ipAddress }) => {
  const attachment = await assertAttachmentExists(attachmentId);
  const version = attachment.currentVersion;
  if (!version) throw new AppError(404, "Version not found");

  if (!PREVIEWABLE_MIME_TYPES.includes(version.mimeType)) {
    throw new AppError(415, `Preview is not supported for file type "${version.mimeType}"`);
  }

  const stream = await storageService.getStreamByLocation(version.storageBucket, version.storageKey);

  await fileActivityRepository
    .record({
      fileId: attachment.fileId,
      userId: actorId ?? null,
      activityType: "VIEW",
      ipAddress: ipAddress ?? null,
      metadata: { attachmentId, versionId: version.id },
    })
    .catch(() => {});

  return { stream, version: sanitizeVersion(version) };
};

/**
 * Soft delete only -- the underlying MinIO objects/versions are kept
 * intact (unlike the Storage Module's own hard delete). These are
 * government records; a deleted attachment must remain recoverable/
 * auditable, not purged. Actual destruction is Archive/retention
 * territory (Phase 10), not a routine attachment operation.
 */
export const deleteAttachment = async ({ attachmentId, actorId, ipAddress }) => {
  const attachment = await assertAttachmentExists(attachmentId);
  assertFileNotArchived(await assertFileExists(attachment.fileId));

  const deleted = await fileAttachmentRepository.softDelete(attachmentId, actorId);

  await logAudit({
    actorId,
    action: AUDIT_ACTIONS.ATTACHMENT_DELETED,
    entityId: attachmentId,
    metadata: { fileId: attachment.fileId },
    ipAddress,
  });

  publish({
    type: "ATTACHMENT_DELETED",
    fileId: attachment.fileId,
    actorId,
    sourceType: "FileAttachment",
    sourceId: attachmentId,
    title: "Attachment deleted",
    description: attachment.title,
  });

  return sanitize(deleted);
};
