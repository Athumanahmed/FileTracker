import prisma from "../config/prisma.js";

const DETAIL_INCLUDE = {
  archivedBy: { select: { id: true, fullName: true, username: true } },
  restoredBy: { select: { id: true, fullName: true, username: true } },
};

export const findByFileId = (fileId) => prisma.archiveRecord.findUnique({ where: { fileId }, include: DETAIL_INCLUDE });

/**
 * One ArchiveRecord per File for life (schema's fileId is @unique) -- an
 * archive/restore/archive-again cycle updates the same row rather than
 * creating a new one each time. AuditLog/TimelineEvent already carry the
 * historical trail of each individual action; this row is the current
 * archival-state snapshot, not a log.
 */
export const upsertArchived = ({ fileId, archivedById, previousStatus, retentionYears, retentionExpiresAt, storageLocation, remarks }) =>
  prisma.archiveRecord.upsert({
    where: { fileId },
    create: {
      fileId,
      status: "ARCHIVED",
      archivedById,
      archivedAt: new Date(),
      previousStatus,
      retentionYears,
      retentionExpiresAt,
      storageLocation: storageLocation ?? null,
      remarks: remarks ?? null,
    },
    update: {
      status: "ARCHIVED",
      archivedById,
      archivedAt: new Date(),
      previousStatus,
      retentionYears,
      retentionExpiresAt,
      storageLocation: storageLocation ?? null,
      remarks: remarks ?? null,
      // Clear any stale restore trail from a prior cycle.
      restoredById: null,
      restoredAt: null,
    },
    include: DETAIL_INCLUDE,
  });

export const markRestored = (fileId, restoredById) =>
  prisma.archiveRecord.update({
    where: { fileId },
    data: { status: "RESTORED", restoredById, restoredAt: new Date() },
    include: DETAIL_INCLUDE,
  });

/** Retention dashboard: everything currently archived whose retention window has already lapsed. */
export const findExpiredRetention = () =>
  prisma.archiveRecord.findMany({
    where: { status: "ARCHIVED", retentionExpiresAt: { lt: new Date() } },
    include: { ...DETAIL_INCLUDE, file: { select: { id: true, fileNumber: true, title: true } } },
    orderBy: { retentionExpiresAt: "asc" },
  });

/**
 * Flat archive-record shape for the Archive Dashboard's stats/charts --
 * grouped in JS (municipal-scale volume, same rationale as
 * report.repository.js#findAllForReporting).
 */
export const findAllForStats = () =>
  prisma.archiveRecord.findMany({
    select: {
      status: true,
      archivedAt: true,
      retentionExpiresAt: true,
      retentionYears: true,
      file: { select: { id: true, fileNumber: true, title: true } },
    },
  });

/** Files whose workflow is over but that haven't been archived yet, grouped by their terminal status. */
export const countReadyToArchiveByStatus = () =>
  prisma.file.groupBy({
    by: ["status"],
    where: { deletedAt: null, status: { in: ["COMPLETED", "REJECTED", "CLOSED"] } },
    _count: { _all: true },
  });
