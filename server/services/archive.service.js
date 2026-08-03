import { AppError } from "../utils/AppError.js";
import { AUDIT_ACTIONS } from "../utils/auditActions.js";
import { publish } from "../utils/eventBus.js";
import * as authRepository from "../repositories/auth.repository.js";
import * as fileRepository from "../repositories/file.repository.js";
import * as fileCategoryRepository from "../repositories/fileCategory.repository.js";
import * as archiveRecordRepository from "../repositories/archiveRecord.repository.js";

const ARCHIVABLE_STATUSES = ["COMPLETED", "REJECTED", "CLOSED"];
const MS_PER_YEAR = 365 * 24 * 60 * 60 * 1000;

const sanitize = (record) =>
  record && {
    id: record.id,
    fileId: record.fileId,
    status: record.status,
    previousStatus: record.previousStatus,
    archivedBy: record.archivedBy,
    archivedAt: record.archivedAt,
    retentionYears: record.retentionYears,
    retentionExpiresAt: record.retentionExpiresAt,
    storageLocation: record.storageLocation,
    restoredBy: record.restoredBy,
    restoredAt: record.restoredAt,
    remarks: record.remarks,
  };

const logAudit = ({ actorId, action, entityId, metadata, ipAddress }) =>
  authRepository.createAuditLog({
    userId: actorId,
    action,
    entity: "ArchiveRecord",
    entityId,
    description: `${action} (${entityId})`,
    metadata: metadata ?? null,
    ipAddress,
  });

/**
 * Archiving is deliberately NOT gated on "current holder" the way
 * workflow actions are -- by the time a file is COMPLETED/REJECTED/
 * CLOSED, its workflow is already over and there's no active step-holder
 * driving it. Access is permission-only (ARCHIVE.MANAGE).
 */
export const archiveFile = async ({ fileId, retentionYears, storageLocation, remarks, actorId, ipAddress }) => {
  const file = await fileRepository.findById(fileId);
  if (!file) throw new AppError(404, "File not found");

  if (file.status === "ARCHIVED") throw new AppError(409, "File is already archived");
  if (!ARCHIVABLE_STATUSES.includes(file.status)) {
    throw new AppError(409, "Only a completed, rejected, or closed file can be archived");
  }

  // Explicit override wins; otherwise fall back to the file's category
  // default (Phase -1 seeded FileCategory.defaultRetentionYears exactly
  // for this) -- retention is opt-out, not something every archive call
  // has to specify by hand.
  const category = await fileCategoryRepository.findById(file.categoryId);
  const resolvedRetentionYears = retentionYears ?? category?.defaultRetentionYears ?? null;
  const retentionExpiresAt = resolvedRetentionYears ? new Date(Date.now() + resolvedRetentionYears * MS_PER_YEAR) : null;

  const record = await archiveRecordRepository.upsertArchived({
    fileId,
    archivedById: actorId,
    previousStatus: file.status,
    retentionYears: resolvedRetentionYears,
    retentionExpiresAt,
    storageLocation,
    remarks,
  });

  await fileRepository.updateStatus(fileId, "ARCHIVED");

  await logAudit({
    actorId,
    action: AUDIT_ACTIONS.FILE_ARCHIVED,
    entityId: record.id,
    metadata: { fileId, retentionYears: resolvedRetentionYears, storageLocation: storageLocation ?? null },
    ipAddress,
  });

  publish({
    type: "FILE_ARCHIVED",
    fileId,
    actorId,
    sourceType: "ArchiveRecord",
    sourceId: record.id,
    title: "File archived",
    description: remarks ?? null,
    recipientIds: file.registeredById ? [file.registeredById] : [],
  });

  return sanitize(record);
};

/** Reverses an archive: reinstates the File's pre-archive status (COMPLETED/REJECTED/CLOSED), making it mutable again. */
export const restoreFile = async ({ fileId, remarks, actorId, ipAddress }) => {
  const file = await fileRepository.findById(fileId);
  if (!file) throw new AppError(404, "File not found");

  const record = await archiveRecordRepository.findByFileId(fileId);
  if (!record || record.status !== "ARCHIVED") throw new AppError(409, "File is not currently archived");

  const updated = await archiveRecordRepository.markRestored(fileId, actorId);
  await fileRepository.updateStatus(fileId, record.previousStatus ?? "COMPLETED");

  await logAudit({
    actorId,
    action: AUDIT_ACTIONS.FILE_RESTORED,
    entityId: updated.id,
    metadata: { fileId, restoredToStatus: record.previousStatus ?? "COMPLETED", remarks: remarks ?? null },
    ipAddress,
  });

  publish({
    type: "FILE_RESTORED",
    fileId,
    actorId,
    sourceType: "ArchiveRecord",
    sourceId: updated.id,
    title: "File restored from archive",
    description: remarks ?? null,
    recipientIds: file.registeredById ? [file.registeredById] : [],
  });

  return sanitize(updated);
};

export const getArchiveStatus = async (fileId) => {
  const file = await fileRepository.findById(fileId);
  if (!file) throw new AppError(404, "File not found");

  const record = await archiveRecordRepository.findByFileId(fileId);
  return sanitize(record);
};

/** Retention dashboard: every archived file whose retention window has already lapsed and is eligible for destruction review. */
export const listExpiredRetention = async () => {
  const records = await archiveRecordRepository.findExpiredRetention();
  return records.map((r) => ({ ...sanitize(r), file: r.file }));
};
