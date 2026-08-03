import minioClient from "../config/minio.js";
import prisma from "../config/prisma.js";

/**
 * Data-access layer for the Storage module -- the ONLY file in the system
 * allowed to import config/minio.js. Every other module (and every future
 * business module -- Attachments, profile images, report exports) reaches
 * storage exclusively through storage.service.js, never through this file
 * or the MinIO SDK directly.
 *
 * Two sections:
 *   - Provider  : thin wrapper around the MinIO SDK. Swapping to AWS S3 /
 *                 Azure Blob / GCS later means rewriting only this section
 *                 (all four speak S3-compatible APIs) -- storage.service.js
 *                 and everything above it never changes.
 *   - Metadata  : Prisma CRUD for the StorageObject catalog.
 */

// ---------------------------------------------------------------------
// Provider (MinIO)
// ---------------------------------------------------------------------

export const bucketExists = (bucket) => minioClient.bucketExists(bucket);

export const makeBucket = (bucket, region) => minioClient.makeBucket(bucket, region);

export const listBuckets = () => minioClient.listBuckets();

export const putObject = (bucket, objectKey, buffer, size, metaData) =>
  minioClient.putObject(bucket, objectKey, buffer, size, metaData);

export const removeObject = (bucket, objectKey) => minioClient.removeObject(bucket, objectKey);

export const statObject = (bucket, objectKey) => minioClient.statObject(bucket, objectKey);

export const getObjectStream = (bucket, objectKey) => minioClient.getObject(bucket, objectKey);

export const presignedGetObject = (bucket, objectKey, expirySeconds) =>
  minioClient.presignedGetObject(bucket, objectKey, expirySeconds);

// ---------------------------------------------------------------------
// Metadata (StorageObject)
// ---------------------------------------------------------------------

export const createMetadata = (data) => prisma.storageObject.create({ data });

export const findMetadataById = (id) =>
  prisma.storageObject.findFirst({ where: { id, deletedAt: null } });

export const findMetadataByChecksum = (checksum) =>
  prisma.storageObject.findFirst({ where: { checksum, deletedAt: null } });

export const softDeleteMetadata = (id, deletedById) =>
  prisma.storageObject.update({
    where: { id },
    data: { deletedAt: new Date(), deletedById },
  });
