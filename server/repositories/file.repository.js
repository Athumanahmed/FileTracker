import prisma from "../config/prisma.js";

/** Data-access layer for the File aggregate root. Every Prisma call the module makes lives here. */

const DETAIL_INCLUDE = {
  category: { select: { id: true, name: true, code: true } },
  department: { select: { id: true, name: true, code: true } },
  citizen: {
    select: { id: true, citizenNumber: true, fullName: true, phoneNumber: true, nationalId: true },
  },
  registeredBy: { select: { id: true, fullName: true, username: true } },
  attachments: {
    where: { deletedAt: null },
    include: { currentVersion: true },
  },
};

/**
 * Registration is all-or-nothing: the File row and every initial
 * attachment/version row are created in one transaction. The underlying
 * MinIO uploads already happened (and were already compensated on
 * failure) before this is called -- see file.service.js#registerFile.
 */
export const createFileWithAttachments = ({ fileData, attachments }) =>
  prisma.$transaction(async (tx) => {
    const file = await tx.file.create({ data: fileData });

    for (const attachment of attachments) {
      const createdAttachment = await tx.fileAttachment.create({
        data: {
          fileId: file.id,
          title: attachment.title,
          attachmentType: attachment.attachmentType,
        },
      });

      const version = await tx.fileVersion.create({
        data: {
          attachmentId: createdAttachment.id,
          versionNumber: 1,
          storageBucket: attachment.storageBucket,
          storageKey: attachment.storageKey,
          originalFileName: attachment.originalFileName,
          mimeType: attachment.mimeType,
          fileSizeBytes: attachment.fileSizeBytes,
          checksum: attachment.checksum,
          uploadedById: attachment.uploadedById,
        },
      });

      await tx.fileAttachment.update({
        where: { id: createdAttachment.id },
        data: { currentVersionId: version.id },
      });
    }

    return tx.file.findUniqueOrThrow({ where: { id: file.id }, include: DETAIL_INCLUDE });
  });

export const findById = (id) => prisma.file.findFirst({ where: { id, deletedAt: null }, include: DETAIL_INCLUDE });

export const findMany = ({ where, orderBy, skip, take }) =>
  prisma.file.findMany({
    where: { ...where, deletedAt: null },
    orderBy,
    skip,
    take,
    include: {
      category: { select: { id: true, name: true, code: true } },
      department: { select: { id: true, name: true, code: true } },
      citizen: { select: { id: true, citizenNumber: true, fullName: true } },
    },
  });

export const count = (where) => prisma.file.count({ where: { ...where, deletedAt: null } });

export const updateStatus = (id, status) => prisma.file.update({ where: { id }, data: { status } });

const EXPORT_ROW_LIMIT = 5000;

/** Reports' file export (Phase 11) -- unpaginated, but still capped, and shaped for a flat spreadsheet/PDF row rather than the API's nested JSON. */
export const findAllForExport = (where) =>
  prisma.file.findMany({
    where: { ...where, deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: EXPORT_ROW_LIMIT,
    select: {
      fileNumber: true,
      registryNumber: true,
      trackingNumber: true,
      title: true,
      status: true,
      priority: true,
      confidentiality: true,
      category: { select: { name: true } },
      department: { select: { name: true } },
      citizen: { select: { fullName: true, phoneNumber: true } },
      createdAt: true,
      dueDate: true,
      closedAt: true,
    },
  });

/** Global Search's file half -- a lightweight top-N lookup, not the full listing query. */
export const searchTop = (term, limit) =>
  prisma.file.findMany({
    where: {
      deletedAt: null,
      OR: [
        { fileNumber: { contains: term, mode: "insensitive" } },
        { registryNumber: { contains: term, mode: "insensitive" } },
        { trackingNumber: { contains: term, mode: "insensitive" } },
        { title: { contains: term, mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      fileNumber: true,
      registryNumber: true,
      trackingNumber: true,
      title: true,
      status: true,
      priority: true,
      createdAt: true,
      department: { select: { id: true, name: true } },
      category: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
