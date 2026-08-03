-- DropForeignKey
ALTER TABLE "FileMovement" DROP CONSTRAINT "FileMovement_toUserId_fkey";

-- AlterTable
ALTER TABLE "FileMovement" ALTER COLUMN "toUserId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "FileMovement" ADD CONSTRAINT "FileMovement_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
