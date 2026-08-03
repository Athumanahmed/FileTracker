import { AppError } from "../utils/AppError.js";
import { AUDIT_ACTIONS } from "../utils/auditActions.js";
import { publish } from "../utils/eventBus.js";
import { parsePagination, parseSort, buildPaginationMeta, buildSearchClause } from "../utils/queryOptions.js";
import * as authRepository from "../repositories/auth.repository.js";
import * as fileRepository from "../repositories/file.repository.js";
import * as fileCategoryRepository from "../repositories/fileCategory.repository.js";
import * as departmentRepository from "../repositories/department.repository.js";
import * as citizenService from "./citizen.service.js";
import * as numberSequenceService from "./numberSequence.service.js";
import * as storageService from "../storage/storage.service.js";

const SORTABLE_FIELDS = ["fileNumber", "registryNumber", "trackingNumber", "title", "createdAt", "priority", "status", "dueDate"];
const SEARCHABLE_FIELDS = ["fileNumber", "registryNumber", "trackingNumber", "title"];

const sanitizeVersion = (version) =>
  version && {
    id: version.id,
    versionNumber: version.versionNumber,
    originalFileName: version.originalFileName,
    mimeType: version.mimeType,
    fileSizeBytes: Number(version.fileSizeBytes),
    checksum: version.checksum,
    createdAt: version.createdAt,
  };

const sanitizeAttachment = (attachment) => ({
  id: attachment.id,
  title: attachment.title,
  attachmentType: attachment.attachmentType,
  currentVersion: sanitizeVersion(attachment.currentVersion),
});

const sanitize = (file) => ({
  id: file.id,
  fileNumber: file.fileNumber,
  registryNumber: file.registryNumber,
  trackingNumber: file.trackingNumber,
  title: file.title,
  description: file.description,
  status: file.status,
  priority: file.priority,
  confidentiality: file.confidentiality,
  source: file.source,
  category: file.category,
  department: file.department,
  citizen: file.citizen,
  registeredBy: file.registeredBy,
  dueDate: file.dueDate,
  createdAt: file.createdAt,
  updatedAt: file.updatedAt,
  attachments: file.attachments?.map(sanitizeAttachment),
});

const sanitizeListItem = (file) => ({
  id: file.id,
  fileNumber: file.fileNumber,
  registryNumber: file.registryNumber,
  trackingNumber: file.trackingNumber,
  title: file.title,
  status: file.status,
  priority: file.priority,
  confidentiality: file.confidentiality,
  category: file.category,
  department: file.department,
  citizen: file.citizen,
  createdAt: file.createdAt,
});

const snapshot = (file) => ({
  fileNumber: file.fileNumber,
  registryNumber: file.registryNumber,
  trackingNumber: file.trackingNumber,
  title: file.title,
  categoryId: file.categoryId,
  departmentId: file.departmentId,
  citizenId: file.citizenId,
  status: file.status,
  priority: file.priority,
  confidentiality: file.confidentiality,
});

const logAudit = ({ actorId, action, entityId, after, ipAddress }) =>
  authRepository.createAuditLog({
    userId: actorId,
    action,
    entity: "File",
    entityId,
    description: `${action} (${entityId})`,
    metadata: { before: null, after: after ?? null },
    ipAddress,
  });

/**
 * Best-effort cleanup for uploads that already reached MinIO/StorageObject
 * before the File-domain DB transaction failed -- see storage.service.js
 * for why upload-then-compensate is the only available "transaction"
 * shape across Postgres and the object store.
 */
const compensateUploads = (uploadedObjects, actorId, ipAddress) =>
  Promise.all(
    uploadedObjects.map((object) =>
      storageService.deleteObject({ id: object.id, actorId, ipAddress }).catch(() => {}),
    ),
  );

/**
 * Registers a new file: resolves/validates category, department and
 * citizen; generates the three system numbers; uploads any initial
 * attachments through the Storage Module; and persists everything in one
 * DB transaction. Registry-Officer-only (enforced by FILES.REGISTER at
 * the route level, not here).
 */
export const registerFile = async ({ actorId, payload, files = [], ipAddress }) => {
  const category = await fileCategoryRepository.findById(payload.categoryId);
  if (!category) throw new AppError(404, "File category not found or inactive");

  const department = await departmentRepository.findById(payload.departmentId);
  if (!department || !department.isActive) throw new AppError(404, "Department not found or inactive");

  const citizen = await citizenService.findOrCreateCitizen({
    citizenId: payload.citizenId,
    citizenPayload: payload.citizen,
    actorId,
  });

  const year = new Date().getFullYear();
  const [fileNumber, registryNumber, trackingNumber] = await Promise.all([
    numberSequenceService.generateFileNumber(department.code, year),
    numberSequenceService.generateRegistryNumber(year),
    numberSequenceService.generateTrackingNumber(year),
  ]);

  const uploadedObjects = [];
  try {
    for (const file of files) {
      const uploaded = await storageService.uploadObject({
        buffer: file.buffer,
        originalFileName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        uploadedById: actorId,
        context: "FILE_ATTACHMENT",
        ipAddress,
      });
      uploadedObjects.push(uploaded);
    }
  } catch (err) {
    await compensateUploads(uploadedObjects, actorId, ipAddress);
    throw err;
  }

  let file;
  try {
    file = await fileRepository.createFileWithAttachments({
      fileData: {
        fileNumber,
        registryNumber,
        trackingNumber,
        title: payload.title,
        description: payload.description || null,
        categoryId: category.id,
        departmentId: department.id,
        citizenId: citizen?.id || null,
        status: "REGISTERED",
        priority: payload.priority || "NORMAL",
        confidentiality: payload.confidentiality || "INTERNAL",
        source: payload.source || "INTERNAL",
        registeredById: actorId,
        dueDate: payload.dueDate ? new Date(payload.dueDate) : null,
      },
      attachments: uploadedObjects.map((object) => ({
        title: object.originalFileName,
        attachmentType: "DOCUMENT",
        storageBucket: object.bucket,
        storageKey: object.objectKey,
        originalFileName: object.originalFileName,
        mimeType: object.mimeType,
        fileSizeBytes: BigInt(object.sizeBytes),
        checksum: object.checksum,
        uploadedById: actorId,
      })),
    });
  } catch (err) {
    await compensateUploads(uploadedObjects, actorId, ipAddress);
    throw err;
  }

  await logAudit({
    actorId,
    action: AUDIT_ACTIONS.FILE_REGISTERED,
    entityId: file.id,
    after: snapshot(file),
    ipAddress,
  });

  // "File registered" is distinct from the later "File registered into
  // workflow" event a workflow instance start publishes (see
  // workflowEngine.service.js) -- this one marks the file's actual birth,
  // which may happen well before any workflow is started on it.
  publish({
    type: "FILE_REGISTERED",
    fileId: file.id,
    actorId,
    sourceType: "File",
    sourceId: file.id,
    title: "File registered",
    description: `${file.fileNumber} - ${file.title}`,
  });

  for (const attachment of file.attachments ?? []) {
    publish({
      type: "ATTACHMENT_UPLOADED",
      fileId: file.id,
      actorId,
      sourceType: "FileAttachment",
      sourceId: attachment.id,
      title: "Attachment uploaded",
      description: attachment.title,
    });
  }

  return sanitize(file);
};

export const getFileById = async (id) => {
  const file = await fileRepository.findById(id);
  if (!file) throw new AppError(404, "File not found");
  return sanitize(file);
};

/**
 * The Advanced Search (Phase 9) where-clause builder -- exported so
 * Reports' file export (Phase 11) can reuse the exact same filter
 * criteria instead of re-implementing it. One definition of "what
 * criteria narrow the file set", used by both the paginated listing and
 * the unpaginated export.
 */
export const buildFileWhereClause = (query) => ({
  ...(query.status ? { status: query.status } : {}),
  ...(query.priority ? { priority: query.priority } : {}),
  ...(query.confidentiality ? { confidentiality: query.confidentiality } : {}),
  ...(query.departmentId ? { departmentId: query.departmentId } : {}),
  ...(query.categoryId ? { categoryId: query.categoryId } : {}),
  ...(query.citizenId ? { citizenId: query.citizenId } : {}),
  ...(query.citizenPhone ? { citizen: { phoneNumber: { contains: query.citizenPhone } } } : {}),
  // "Owner" = the file's current holder, derived from FileAssignment
  // (isCurrent: true) -- File deliberately has no denormalized owner
  // column (see schema.prisma), so this is a relation filter, not a
  // plain equality match.
  ...(query.assignedToId ? { assignments: { some: { isCurrent: true, assignedToId: query.assignedToId } } } : {}),
  ...(query.dateFrom || query.dateTo
    ? {
        createdAt: {
          ...(query.dateFrom ? { gte: new Date(query.dateFrom) } : {}),
          ...(query.dateTo ? { lte: new Date(query.dateTo) } : {}),
        },
      }
    : {}),
  ...buildSearchClause(query.search, SEARCHABLE_FIELDS),
});

/** Doubles as "Advanced Search" (Phase 9) -- the criteria list on top of the base listing is just a richer where clause. */
export const listFiles = async ({ query }) => {
  const { page, limit, skip, take } = parsePagination(query);
  const orderBy = parseSort(query, SORTABLE_FIELDS, "createdAt");
  const where = buildFileWhereClause(query);

  const [items, total] = await Promise.all([
    fileRepository.findMany({ where, orderBy, skip, take }),
    fileRepository.count(where),
  ]);

  return { items: items.map(sanitizeListItem), meta: buildPaginationMeta(total, page, limit) };
};
