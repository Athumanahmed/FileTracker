/**
 * Canonical bucket names for the Storage Module -- the single source of
 * truth so no other module ever hardcodes a bucket string. FILES is the
 * only bucket needed at this phase; later phases may add more (e.g. a
 * dedicated bucket for temporary/staged uploads).
 */
export const STORAGE_BUCKETS = {
  FILES: process.env.MINIO_BUCKET_NAME || "eftms-files",
};

export const MINIO_DEFAULT_REGION = process.env.MINIO_REGION || "us-east-1";

export const MAX_FILE_SIZE_BYTES = Number(process.env.STORAGE_MAX_FILE_SIZE_BYTES) || 25 * 1024 * 1024;

/**
 * Deliberately narrow, government-registry-relevant document/image types.
 * Callers of a future business module (e.g. Attachments in Phase 3) can
 * pass a stricter subset of this list; they can never widen it here.
 */
export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "image/jpeg",
  "image/png",
  "image/webp",
  "text/plain",
  "text/csv",
];

export const PRESIGNED_URL_EXPIRY_SECONDS = Number(process.env.STORAGE_PRESIGNED_URL_EXPIRY_SECONDS) || 15 * 60;
