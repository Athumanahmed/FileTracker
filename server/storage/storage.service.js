import { randomUUID, createHash } from "node:crypto";
import path from "node:path";

import { AppError } from "../utils/AppError.js";
import { AUDIT_ACTIONS } from "../utils/auditActions.js";
import * as authRepository from "../repositories/auth.repository.js";
import * as storageRepository from "./storage.repository.js";
import {
  STORAGE_BUCKETS,
  MINIO_DEFAULT_REGION,
  MAX_FILE_SIZE_BYTES,
  ALLOWED_MIME_TYPES,
  PRESIGNED_URL_EXPIRY_SECONDS,
} from "./storage.constants.js";

const logAudit = ({ actorId, action, entityId, metadata, ipAddress }) =>
  authRepository.createAuditLog({
    userId: actorId ?? null,
    action,
    entity: "StorageObject",
    entityId: entityId ?? null,
    description: `${action} (${entityId ?? "n/a"})`,
    metadata: metadata ?? null,
    ipAddress: ipAddress ?? null,
  });

const sanitize = (storageObject) => ({
  id: storageObject.id,
  bucket: storageObject.bucket,
  objectKey: storageObject.objectKey,
  originalFileName: storageObject.originalFileName,
  mimeType: storageObject.mimeType,
  sizeBytes: Number(storageObject.sizeBytes),
  checksum: storageObject.checksum,
  context: storageObject.context,
  uploadedById: storageObject.uploadedById,
  createdAt: storageObject.createdAt,
});

/**
 * Idempotently ensures every bucket this module depends on exists. Called
 * once at server boot so uploads never fail on a missing bucket.
 */
export const ensureBuckets = async () => {
  const buckets = Object.values(STORAGE_BUCKETS);

  for (const bucket of buckets) {
    const exists = await storageRepository.bucketExists(bucket);
    if (!exists) {
      await storageRepository.makeBucket(bucket, MINIO_DEFAULT_REGION);
    }
  }
};

/** Powers the /storage/health endpoint -- confirms MinIO is reachable and every configured bucket exists. */
export const checkHealth = async () => {
  const buckets = await storageRepository.listBuckets();
  const existingNames = buckets.map((bucket) => bucket.name);

  return {
    connected: true,
    buckets: Object.values(STORAGE_BUCKETS).map((name) => ({
      name,
      exists: existingNames.includes(name),
    })),
  };
};

const assertValidFile = ({ mimeType, size }) => {
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    throw new AppError(415, `File type "${mimeType}" is not allowed`);
  }
  if (size > MAX_FILE_SIZE_BYTES) {
    throw new AppError(413, `File exceeds the maximum allowed size of ${MAX_FILE_SIZE_BYTES} bytes`);
  }
};

/**
 * `<year>/<month>/<uuid>-<sanitized-original-name>` -- date-based prefixes
 * keep the bucket human-browsable in the MinIO console (folders read as
 * "2026/08/" instead of a wall of opaque UUIDs), while the UUID prefix on
 * the object itself still guarantees collision-free keys (required by
 * "Unique Object Naming") and the readable name/extension stay intact for
 * the eventual download filename. Deliberately date-based rather than
 * category/department-based -- this module is provider-agnostic and
 * context-free by design (see the module docstring), so foldering by a
 * business concept it has no knowledge of would leak that boundary; upload
 * date is the one dimension every caller already has for free.
 */
const generateObjectKey = (originalFileName) => {
  const ext = path.extname(originalFileName);
  const base = path.basename(originalFileName, ext);
  const safeBase = base.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 80) || "file";
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}/${month}/${randomUUID()}-${safeBase}${ext}`;
};

const computeChecksum = (buffer) => createHash("sha256").update(buffer).digest("hex");

/**
 * Upload has no real distributed transaction available (Postgres and
 * MinIO can't share one) -- this implements the practical alternative:
 * write to the provider first, then persist metadata; if the metadata
 * write fails, compensate by deleting the just-written object so a
 * failed upload never leaves an orphaned, untracked blob behind.
 */
export const uploadObject = async ({ buffer, originalFileName, mimeType, size, uploadedById, context, ipAddress }) => {
  assertValidFile({ mimeType, size });

  const bucket = STORAGE_BUCKETS.FILES;
  const objectKey = generateObjectKey(originalFileName);
  const checksum = computeChecksum(buffer);

  await storageRepository.putObject(bucket, objectKey, buffer, size, {
    "Content-Type": mimeType,
    "X-Amz-Meta-Original-Filename": originalFileName,
    "X-Amz-Meta-Checksum": checksum,
  });

  let storageObject;
  try {
    storageObject = await storageRepository.createMetadata({
      bucket,
      objectKey,
      originalFileName,
      mimeType,
      sizeBytes: BigInt(size),
      checksum,
      context: context ?? null,
      uploadedById: uploadedById ?? null,
    });
  } catch (err) {
    await storageRepository.removeObject(bucket, objectKey).catch(() => {});
    throw err;
  }

  await logAudit({
    actorId: uploadedById,
    action: AUDIT_ACTIONS.STORAGE_OBJECT_UPLOADED,
    entityId: storageObject.id,
    metadata: { bucket, objectKey, originalFileName, mimeType, sizeBytes: size, checksum, context: context ?? null },
    ipAddress,
  });

  return sanitize(storageObject);
};

export const getMetadata = async (id) => {
  const storageObject = await storageRepository.findMetadataById(id);
  if (!storageObject) throw new AppError(404, "Storage object not found");
  return sanitize(storageObject);
};

/** Returns the object's readable stream plus the metadata needed to set response headers. */
export const getDownloadStream = async (id) => {
  const storageObject = await storageRepository.findMetadataById(id);
  if (!storageObject) throw new AppError(404, "Storage object not found");

  const stream = await storageRepository.getObjectStream(storageObject.bucket, storageObject.objectKey);
  return { stream, storageObject: sanitize(storageObject) };
};

/**
 * For callers that already have a bucket/objectKey and don't go through
 * the StorageObject catalog at all -- e.g. FileVersion (Phase 3), which is
 * deliberately self-contained (see schema.prisma) rather than holding a
 * StorageObject FK. Still routes through the Storage Service, never a
 * direct MinIO call from the calling module.
 */
export const getStreamByLocation = (bucket, objectKey) => storageRepository.getObjectStream(bucket, objectKey);

/**
 * A presigned URL grants time-limited access without going through the
 * API's own auth on every byte -- worth its own audit entry given files
 * in this system can be CONFIDENTIAL/SECRET.
 */
export const generatePresignedUrl = async ({ id, actorId, ipAddress, expirySeconds }) => {
  const storageObject = await storageRepository.findMetadataById(id);
  if (!storageObject) throw new AppError(404, "Storage object not found");

  const expiry = expirySeconds ?? PRESIGNED_URL_EXPIRY_SECONDS;
  const url = await storageRepository.presignedGetObject(storageObject.bucket, storageObject.objectKey, expiry);

  await logAudit({
    actorId,
    action: AUDIT_ACTIONS.STORAGE_PRESIGNED_URL_GENERATED,
    entityId: storageObject.id,
    metadata: { bucket: storageObject.bucket, objectKey: storageObject.objectKey, expirySeconds: expiry },
    ipAddress,
  });

  return { url, expiresInSeconds: expiry };
};

/**
 * Removes the object from the provider first, then soft-deletes the
 * metadata row. That order is deliberate: if the metadata write failed
 * first and the provider removal failed after, the row would still
 * point at a live object masquerading as deleted -- worse than the
 * (recoverable, admin-visible) reverse failure of a dangling row after
 * a successful provider delete.
 */
export const deleteObject = async ({ id, actorId, ipAddress }) => {
  const storageObject = await storageRepository.findMetadataById(id);
  if (!storageObject) throw new AppError(404, "Storage object not found");

  await storageRepository.removeObject(storageObject.bucket, storageObject.objectKey);
  const deleted = await storageRepository.softDeleteMetadata(storageObject.id, actorId ?? null);

  await logAudit({
    actorId,
    action: AUDIT_ACTIONS.STORAGE_OBJECT_DELETED,
    entityId: storageObject.id,
    metadata: { bucket: storageObject.bucket, objectKey: storageObject.objectKey },
    ipAddress,
  });

  return sanitize(deleted);
};
