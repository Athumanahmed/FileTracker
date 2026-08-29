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

const YEAR_MS = MS_PER_YEAR;

/** Last `count` calendar months as { period: "YYYY-MM", count: 0 }, oldest first. */
const buildRecentMonths = (count) => {
  const now = new Date();
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (count - 1 - i), 1);
    return { period: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, count: 0 };
  });
};

const monthKey = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

/**
 * Archive Dashboard aggregates -- everything the archivist needs at a
 * glance: how much is waiting, how much is held, and how the held stock is
 * distributed across its remaining retention runway (so destruction-review
 * workload can be anticipated, not just reacted to). Grouped in JS, same
 * municipal-scale rationale as the reporting module.
 */
export const getArchiveStats = async () => {
  const [records, readyGroups] = await Promise.all([
    archiveRecordRepository.findAllForStats(),
    archiveRecordRepository.countReadyToArchiveByStatus(),
  ]);

  const readyToArchive = { COMPLETED: 0, REJECTED: 0, CLOSED: 0, total: 0 };
  for (const group of readyGroups) {
    readyToArchive[group.status] = group._count._all;
    readyToArchive.total += group._count._all;
  }

  const now = Date.now();
  const archived = records.filter((r) => r.status === "ARCHIVED");
  const restored = records.filter((r) => r.status === "RESTORED").length;

  const runway = { expired: 0, within1: 0, within3: 0, within7: 0, beyond7: 0, none: 0 };
  let expiredRetention = 0;
  let withinRetention = 0;
  let noRetentionSet = 0;

  for (const record of archived) {
    if (!record.retentionExpiresAt) {
      noRetentionSet += 1;
      runway.none += 1;
      continue;
    }
    const yearsLeft = (new Date(record.retentionExpiresAt).getTime() - now) / YEAR_MS;
    if (yearsLeft < 0) {
      expiredRetention += 1;
      runway.expired += 1;
    } else {
      withinRetention += 1;
      if (yearsLeft <= 1) runway.within1 += 1;
      else if (yearsLeft <= 3) runway.within3 += 1;
      else if (yearsLeft <= 7) runway.within7 += 1;
      else runway.beyond7 += 1;
    }
  }

  const months = buildRecentMonths(6);
  const monthIndex = new Map(months.map((m, i) => [m.period, i]));
  for (const record of archived) {
    if (!record.archivedAt) continue;
    const idx = monthIndex.get(monthKey(record.archivedAt));
    if (idx !== undefined) months[idx].count += 1;
  }

  const upcomingExpiries = archived
    .filter((r) => r.retentionExpiresAt)
    .sort((a, b) => new Date(a.retentionExpiresAt) - new Date(b.retentionExpiresAt))
    .slice(0, 5)
    .map((r) => ({
      fileId: r.file?.id ?? null,
      fileNumber: r.file?.fileNumber ?? null,
      title: r.file?.title ?? null,
      retentionExpiresAt: r.retentionExpiresAt,
      overdue: new Date(r.retentionExpiresAt).getTime() < now,
    }));

  return {
    readyToArchive,
    archived: archived.length,
    restored,
    expiredRetention,
    withinRetention,
    noRetentionSet,
    archivedByMonth: months,
    retentionRunway: [
      { key: "expired", label: "Expired", count: runway.expired },
      { key: "within1", label: "< 1 yr", count: runway.within1 },
      { key: "within3", label: "1–3 yrs", count: runway.within3 },
      { key: "within7", label: "3–7 yrs", count: runway.within7 },
      { key: "beyond7", label: "7+ yrs", count: runway.beyond7 },
      { key: "none", label: "No expiry", count: runway.none },
    ],
    upcomingExpiries,
  };
};
