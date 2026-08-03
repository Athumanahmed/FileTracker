import prisma from "../config/prisma.js";

const DETAIL_INCLUDE = { currentVersion: true };

export const findById = (id) =>
  prisma.fileAttachment.findFirst({ where: { id, deletedAt: null }, include: DETAIL_INCLUDE });

export const findByFileId = (fileId) =>
  prisma.fileAttachment.findMany({
    where: { fileId, deletedAt: null },
    include: DETAIL_INCLUDE,
    orderBy: { createdAt: "asc" },
  });

export const create = (data) => prisma.fileAttachment.create({ data, include: DETAIL_INCLUDE });

/**
 * Adds a new version (versionNumber = latest+1, or 1 if none exist yet)
 * and repoints currentVersionId to it, atomically. Used for both the
 * first version of a newly-created attachment and for "replace" -- the
 * two operations differ only in whether a version already exists.
 */
export const addVersion = ({ attachmentId, versionData }) =>
  prisma.$transaction(async (tx) => {
    const latest = await tx.fileVersion.findFirst({
      where: { attachmentId },
      orderBy: { versionNumber: "desc" },
    });
    const versionNumber = (latest?.versionNumber ?? 0) + 1;

    const version = await tx.fileVersion.create({ data: { attachmentId, versionNumber, ...versionData } });

    return tx.fileAttachment.update({
      where: { id: attachmentId },
      data: { currentVersionId: version.id },
      include: DETAIL_INCLUDE,
    });
  });

export const findVersions = (attachmentId) =>
  prisma.fileVersion.findMany({ where: { attachmentId }, orderBy: { versionNumber: "desc" } });

export const findVersionById = (attachmentId, versionId) =>
  prisma.fileVersion.findFirst({ where: { id: versionId, attachmentId } });

export const softDelete = (id, deletedById) =>
  prisma.fileAttachment.update({
    where: { id },
    data: { deletedAt: new Date(), deletedById },
    include: DETAIL_INCLUDE,
  });
