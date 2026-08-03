-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'FILE_RESTORED';

-- AlterTable
ALTER TABLE "ArchiveRecord" ADD COLUMN     "previousStatus" "FileStatus";
