-- AlterTable
ALTER TABLE "Citizen" ADD COLUMN     "smsNotificationsEnabled" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "CitizenSmsMessage" (
    "id" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "eventKey" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "QueueStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastError" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CitizenSmsMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CitizenSmsMessage_status_nextAttemptAt_idx" ON "CitizenSmsMessage"("status", "nextAttemptAt");

-- CreateIndex
CREATE INDEX "CitizenSmsMessage_citizenId_idx" ON "CitizenSmsMessage"("citizenId");

-- CreateIndex
CREATE UNIQUE INDEX "CitizenSmsMessage_fileId_eventKey_key" ON "CitizenSmsMessage"("fileId", "eventKey");

-- AddForeignKey
ALTER TABLE "CitizenSmsMessage" ADD CONSTRAINT "CitizenSmsMessage_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "Citizen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CitizenSmsMessage" ADD CONSTRAINT "CitizenSmsMessage_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
