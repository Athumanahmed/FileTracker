import prisma from "../config/prisma.js";

/** Data-access layer for the File aggregate root. Every Prisma call the module makes lives here. */

const DETAIL_INCLUDE = {
  category: { select: { id: true, name: true, code: true } },
  department: { select: { id: true, name: true, code: true } },
  citizen: {
    select: { id: true, citizenNumber: true, fullName: true, phoneNumber: true, nationalId: true, smsNotificationsEnabled: true },
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

    // "Opening" assignment: the registrar holds the freshly registered file
    // until they route it into a workflow -- the digital equivalent of the
    // registry clerk physically holding a new file to write the covering
    // minute before dispatching it. Custody transfers on startWorkflow,
    // which closes this row out (see
    // workflowInstance.repository.js#startInstance). No workflow step and no
    // dueDate -- it isn't part of any template yet.
    await tx.fileAssignment.create({
      data: {
        fileId: file.id,
        assignedToId: fileData.registeredById,
        assignedDepartmentId: fileData.departmentId,
        assignedById: fileData.registeredById,
        workflowStepId: null,
        status: "ASSIGNED",
        isCurrent: true,
        startedAt: new Date(),
        instructions: "File opened at registry.",
      },
    });

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

/** Lean projection for the citizen-SMS subscriber -- just what deciding whether/what to text needs. */
export const findForCitizenNotification = (id) =>
  prisma.file.findFirst({
    where: { id, deletedAt: null },
    select: {
      id: true,
      trackingNumber: true,
      title: true,
      status: true,
      citizenId: true,
      citizen: { select: { id: true, phoneNumber: true, isActive: true, smsNotificationsEnabled: true } },
    },
  });

/**
 * Public file-tracking portal -- matched by ANY of the three reference
 * numbers printed on a citizen's paperwork (tracking / file / registry),
 * since a citizen may quote whichever one they have. The phone check in the
 * service is the real gate; this only narrows to one file.
 */
export const findByPublicReference = (reference) =>
  prisma.file.findFirst({
    where: {
      deletedAt: null,
      OR: [{ trackingNumber: reference }, { fileNumber: reference }, { registryNumber: reference }],
    },
    select: {
      id: true,
      trackingNumber: true,
      title: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      closedAt: true,
      department: { select: { name: true } },
      citizen: { select: { firstName: true, phoneNumber: true } },
    },
  });

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
