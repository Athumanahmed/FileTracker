import { AppError } from "../utils/AppError.js";
import { AUDIT_ACTIONS } from "../utils/auditActions.js";
import { publish } from "../utils/eventBus.js";
import * as authRepository from "../repositories/auth.repository.js";
import * as fileRepository from "../repositories/file.repository.js";
import * as fileAssignmentRepository from "../repositories/fileAssignment.repository.js";
import * as fileMinuteRepository from "../repositories/fileMinute.repository.js";
import * as fileAttachmentService from "./fileAttachment.service.js";
import { assertIsCurrentOwner, assertFileNotArchived } from "./fileOwnership.service.js";

const sanitizeAttachment = (attachment) =>
  attachment && {
    id: attachment.id,
    title: attachment.title,
    attachmentType: attachment.attachmentType,
    currentVersion: attachment.currentVersion && {
      id: attachment.currentVersion.id,
      originalFileName: attachment.currentVersion.originalFileName,
      mimeType: attachment.currentVersion.mimeType,
      fileSizeBytes: Number(attachment.currentVersion.fileSizeBytes),
      checksum: attachment.currentVersion.checksum,
    },
  };

const sanitize = (minute) => ({
  id: minute.id,
  fileId: minute.fileId,
  parentMinuteId: minute.parentMinuteId,
  minuteType: minute.minuteType,
  content: minute.content,
  writtenBy: minute.writtenBy,
  addressedTo: minute.addressedTo,
  repliesCount: minute._count?.replies ?? 0,
  attachments: minute.attachments?.map(sanitizeAttachment),
  createdAt: minute.createdAt,
});

const logAudit = ({ actorId, action, entityId, metadata, ipAddress }) =>
  authRepository.createAuditLog({
    userId: actorId,
    action,
    entity: "FileMinute",
    entityId,
    description: `${action} (${entityId})`,
    metadata: metadata ?? null,
    ipAddress,
  });

/**
 * Uploads any attached files after the minute itself is already committed.
 * A minute is the authoritative record (an instruction, an approval) --
 * losing it because one supporting attachment had a bad MIME type would
 * be worse than the minute existing with a partial attachment set, so
 * failures here are collected and returned, not thrown.
 */
const attachFiles = async ({ fileId, minuteId, actorId, files, ipAddress }) => {
  const attachments = [];
  const attachmentErrors = [];

  for (const uploadedFile of files) {
    try {
      const attachment = await fileAttachmentService.uploadAttachment({
        fileId,
        minuteId,
        actorId,
        title: uploadedFile.originalname,
        uploadedFile,
        ipAddress,
      });
      attachments.push(attachment);
    } catch (err) {
      attachmentErrors.push({ fileName: uploadedFile.originalname, message: err.message });
    }
  }

  return { attachments, attachmentErrors };
};

/** Shared by writeMinute (top-level) and replyToMinute (threaded) -- both are "record a minute on this file". */
const createMinute = async ({ fileId, parentMinuteId, actorId, payload, files, ipAddress }) => {
  const file = await fileRepository.findById(fileId);
  if (!file) throw new AppError(404, "File not found");
  assertFileNotArchived(file);

  const currentAssignment = await fileAssignmentRepository.findCurrentByFileId(fileId);
  await assertIsCurrentOwner({ currentAssignment, actorId });

  if (payload.addressedToId) {
    const addressee = await authRepository.findUserById(payload.addressedToId);
    if (!addressee || !addressee.isActive) throw new AppError(404, "Addressed user not found or inactive");
  }

  const minute = await fileMinuteRepository.create({
    fileId,
    parentMinuteId: parentMinuteId ?? null,
    minuteType: payload.minuteType || "INSTRUCTION",
    content: payload.content,
    writtenById: actorId,
    addressedToId: payload.addressedToId || null,
  });

  const { attachments, attachmentErrors } = await attachFiles({ fileId, minuteId: minute.id, actorId, files, ipAddress });

  await logAudit({
    actorId,
    action: AUDIT_ACTIONS.MINUTE_WRITTEN,
    entityId: minute.id,
    metadata: { fileId, minuteType: minute.minuteType, parentMinuteId: parentMinuteId ?? null },
    ipAddress,
  });

  publish({
    type: "MINUTE_ADDED",
    fileId,
    actorId,
    sourceType: "FileMinute",
    sourceId: minute.id,
    title: parentMinuteId ? `Reply recorded (${minute.minuteType})` : `Minute recorded (${minute.minuteType})`,
    description: minute.content,
    // Only notify when the minute explicitly names someone -- an
    // unaddressed note is just part of the record, not a ping to anyone.
    recipientIds: payload.addressedToId ? [payload.addressedToId] : [],
  });

  return { ...sanitize(minute), attachments: attachments.map(sanitizeAttachment), attachmentErrors: attachmentErrors.length ? attachmentErrors : undefined };
};

export const writeMinute = ({ fileId, actorId, payload, files = [], ipAddress }) =>
  createMinute({ fileId, parentMinuteId: null, actorId, payload, files, ipAddress });

export const replyToMinute = async ({ parentMinuteId, actorId, payload, files = [], ipAddress }) => {
  const parent = await fileMinuteRepository.findById(parentMinuteId);
  if (!parent) throw new AppError(404, "Minute not found");

  return createMinute({ fileId: parent.fileId, parentMinuteId, actorId, payload, files, ipAddress });
};

export const getMinuteById = async (id) => {
  const minute = await fileMinuteRepository.findById(id);
  if (!minute) throw new AppError(404, "Minute not found");
  return sanitize(minute);
};

/** The file's decision history: every instruction, recommendation, approval and note ever recorded, oldest first. */
export const listMinutesByFile = async (fileId) => {
  const file = await fileRepository.findById(fileId);
  if (!file) throw new AppError(404, "File not found");

  const minutes = await fileMinuteRepository.findByFileId(fileId);
  return minutes.map(sanitize);
};

/**
 * Soft delete only, and deliberately narrow: a minute is a formal record
 * (an approval, a decision) -- only the person who wrote it, or an admin,
 * can retract it. Nobody else, not even the file's current holder if
 * that's someone different from the author.
 */
export const deleteMinute = async ({ minuteId, actorId, ipAddress }) => {
  const minute = await fileMinuteRepository.findById(minuteId);
  if (!minute) throw new AppError(404, "Minute not found");

  const file = await fileRepository.findById(minute.fileId);
  if (file) assertFileNotArchived(file);

  if (minute.writtenBy.id !== actorId) {
    const actor = await authRepository.findAuthenticatedUser(actorId);
    const isSystemAdmin = actor?.roles.some((r) => r.role.code === "SYSTEM_ADMIN");
    if (!isSystemAdmin) throw new AppError(403, "Only the author of this minute (or an administrator) can delete it");
  }

  const deleted = await fileMinuteRepository.softDelete(minuteId, actorId);

  await logAudit({ actorId, action: AUDIT_ACTIONS.MINUTE_DELETED, entityId: minuteId, metadata: { fileId: minute.fileId }, ipAddress });

  return sanitize(deleted);
};
