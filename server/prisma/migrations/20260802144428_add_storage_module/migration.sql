-- AlterEnum
ALTER TYPE "SystemModule" ADD VALUE 'STORAGE';

-- CreateTable
CREATE TABLE "StorageObject" (
    "id" TEXT NOT NULL,
    "bucket" TEXT NOT NULL,
    "objectKey" TEXT NOT NULL,
    "originalFileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" BIGINT NOT NULL,
    "checksum" TEXT NOT NULL,
    "context" TEXT,
    "uploadedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    "deletedById" TEXT,

    CONSTRAINT "StorageObject_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StorageObject_checksum_idx" ON "StorageObject"("checksum");

-- CreateIndex
CREATE INDEX "StorageObject_uploadedById_idx" ON "StorageObject"("uploadedById");

-- CreateIndex
CREATE INDEX "StorageObject_context_idx" ON "StorageObject"("context");

-- CreateIndex
CREATE INDEX "StorageObject_createdAt_idx" ON "StorageObject"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "StorageObject_bucket_objectKey_key" ON "StorageObject"("bucket", "objectKey");

-- AddForeignKey
ALTER TABLE "StorageObject" ADD CONSTRAINT "StorageObject_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StorageObject" ADD CONSTRAINT "StorageObject_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
