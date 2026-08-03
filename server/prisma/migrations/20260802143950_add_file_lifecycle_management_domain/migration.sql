-- CreateEnum
CREATE TYPE "FileStatus" AS ENUM ('DRAFT', 'REGISTERED', 'IN_PROGRESS', 'PENDING_ACTION', 'ON_HOLD', 'FORWARDED', 'RETURNED', 'APPROVED', 'REJECTED', 'COMPLETED', 'ARCHIVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "PriorityLevel" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT', 'CRITICAL');

-- CreateEnum
CREATE TYPE "ConfidentialityLevel" AS ENUM ('PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'SECRET', 'TOP_SECRET');

-- CreateEnum
CREATE TYPE "WorkflowAction" AS ENUM ('REGISTER', 'FORWARD', 'RETURN', 'REASSIGN', 'APPROVE', 'REJECT', 'REQUEST_INFORMATION', 'HOLD', 'RESUME', 'COMPLETE', 'ARCHIVE', 'CLOSE');

-- CreateEnum
CREATE TYPE "WorkflowState" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'PENDING_APPROVAL', 'ON_HOLD', 'COMPLETED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MovementStatus" AS ENUM ('PENDING', 'IN_TRANSIT', 'RECEIVED', 'ACKNOWLEDGED', 'REJECTED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('FILE_REGISTERED', 'FILE_ASSIGNED', 'FILE_FORWARDED', 'FILE_RETURNED', 'FILE_APPROVED', 'FILE_REJECTED', 'FILE_ON_HOLD', 'FILE_COMPLETED', 'FILE_ARCHIVED', 'MINUTE_ADDED', 'COMMENT_ADDED', 'ATTACHMENT_UPLOADED', 'DEADLINE_APPROACHING', 'DEADLINE_OVERDUE', 'SYSTEM_ALERT');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP', 'SMS', 'EMAIL', 'PUSH');

-- CreateEnum
CREATE TYPE "ArchiveStatus" AS ENUM ('ACTIVE', 'ARCHIVED', 'RESTORED', 'PENDING_DESTRUCTION', 'DESTROYED');

-- CreateEnum
CREATE TYPE "AttachmentType" AS ENUM ('DOCUMENT', 'IMAGE', 'SCAN', 'LETTER', 'MEMO', 'REPORT', 'CONTRACT', 'INVOICE', 'OTHER');

-- CreateEnum
CREATE TYPE "FileSource" AS ENUM ('WALK_IN', 'POST', 'EMAIL', 'FAX', 'PORTAL', 'INTERNAL', 'COURIER', 'HAND_DELIVERY');

-- CreateEnum
CREATE TYPE "CorrespondenceType" AS ENUM ('INCOMING', 'OUTGOING', 'INTERNAL');

-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'REASSIGNED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MinuteType" AS ENUM ('INSTRUCTION', 'RECOMMENDATION', 'APPROVAL', 'REJECTION', 'NOTE', 'DECISION');

-- CreateEnum
CREATE TYPE "CommentVisibility" AS ENUM ('INTERNAL', 'DEPARTMENT', 'PUBLIC');

-- CreateEnum
CREATE TYPE "FileReferenceType" AS ENUM ('RELATED', 'DUPLICATE_OF', 'SUPERSEDES', 'SUPERSEDED_BY', 'PARENT_OF', 'CHILD_OF', 'MERGED_INTO');

-- CreateTable
CREATE TABLE "FileCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "parentId" TEXT,
    "defaultRetentionYears" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FileCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FileTag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FileTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FileTagMapping" (
    "fileId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "taggedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "taggedById" TEXT,

    CONSTRAINT "FileTagMapping_pkey" PRIMARY KEY ("fileId","tagId")
);

-- CreateTable
CREATE TABLE "Citizen" (
    "id" TEXT NOT NULL,
    "citizenNumber" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "middleName" TEXT,
    "lastName" TEXT NOT NULL,
    "fullName" TEXT,
    "nationalId" TEXT,
    "phoneNumber" TEXT,
    "alternatePhoneNumber" TEXT,
    "email" TEXT,
    "physicalAddress" TEXT,
    "postalAddress" TEXT,
    "ward" TEXT,
    "village" TEXT,
    "district" TEXT,
    "region" TEXT,
    "organizationName" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "registeredById" TEXT,

    CONSTRAINT "Citizen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "File" (
    "id" TEXT NOT NULL,
    "fileNumber" TEXT NOT NULL,
    "registryNumber" TEXT NOT NULL,
    "trackingNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "categoryId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "citizenId" TEXT,
    "status" "FileStatus" NOT NULL DEFAULT 'DRAFT',
    "priority" "PriorityLevel" NOT NULL DEFAULT 'NORMAL',
    "confidentiality" "ConfidentialityLevel" NOT NULL DEFAULT 'INTERNAL',
    "source" "FileSource" NOT NULL DEFAULT 'INTERNAL',
    "registeredById" TEXT,
    "dueDate" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "deletedById" TEXT,

    CONSTRAINT "File_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FileReference" (
    "id" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "referencedFileId" TEXT NOT NULL,
    "referenceType" "FileReferenceType" NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,

    CONSTRAINT "FileReference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FileWatcher" (
    "fileId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "watchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FileWatcher_pkey" PRIMARY KEY ("fileId","userId")
);

-- CreateTable
CREATE TABLE "Correspondence" (
    "id" TEXT NOT NULL,
    "correspondenceNumber" TEXT NOT NULL,
    "type" "CorrespondenceType" NOT NULL,
    "subject" TEXT NOT NULL,
    "referenceNumber" TEXT,
    "correspondenceDate" TIMESTAMP(3) NOT NULL,
    "fileId" TEXT NOT NULL,
    "citizenId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Correspondence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncomingLetter" (
    "id" TEXT NOT NULL,
    "correspondenceId" TEXT NOT NULL,
    "senderName" TEXT NOT NULL,
    "senderAddress" TEXT,
    "senderOrganization" TEXT,
    "senderPhoneNumber" TEXT,
    "senderEmail" TEXT,
    "receivedDate" TIMESTAMP(3) NOT NULL,
    "receivedVia" "FileSource" NOT NULL,
    "receivedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IncomingLetter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutgoingLetter" (
    "id" TEXT NOT NULL,
    "correspondenceId" TEXT NOT NULL,
    "recipientName" TEXT NOT NULL,
    "recipientAddress" TEXT,
    "recipientOrganization" TEXT,
    "recipientPhoneNumber" TEXT,
    "recipientEmail" TEXT,
    "dispatchDate" TIMESTAMP(3),
    "dispatchMethod" "FileSource",
    "dispatchedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutgoingLetter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FileAttachment" (
    "id" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "correspondenceId" TEXT,
    "minuteId" TEXT,
    "title" TEXT NOT NULL,
    "attachmentType" "AttachmentType" NOT NULL DEFAULT 'DOCUMENT',
    "description" TEXT,
    "currentVersionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "deletedById" TEXT,

    CONSTRAINT "FileAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FileVersion" (
    "id" TEXT NOT NULL,
    "attachmentId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "storageBucket" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "originalFileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSizeBytes" BIGINT NOT NULL,
    "checksum" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FileVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FileMovement" (
    "id" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "fromUserId" TEXT,
    "toUserId" TEXT NOT NULL,
    "fromDepartmentId" TEXT,
    "toDepartmentId" TEXT,
    "action" "WorkflowAction" NOT NULL,
    "status" "MovementStatus" NOT NULL DEFAULT 'PENDING',
    "remarks" TEXT,
    "dispatchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "receivedAt" TIMESTAMP(3),
    "workflowExecutionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FileMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FileAssignment" (
    "id" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "assignedToId" TEXT,
    "assignedDepartmentId" TEXT,
    "assignedById" TEXT,
    "workflowStepId" TEXT,
    "status" "AssignmentStatus" NOT NULL DEFAULT 'ASSIGNED',
    "instructions" TEXT,
    "dueDate" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "isCurrent" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FileAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "categoryId" TEXT,
    "departmentId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkflowTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowStep" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "stepOrder" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "requiredPositionId" TEXT,
    "requiredRoleId" TEXT,
    "slaHours" INTEGER,
    "isFinalStep" BOOLEAN NOT NULL DEFAULT false,
    "allowedActions" "WorkflowAction"[] DEFAULT ARRAY[]::"WorkflowAction"[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkflowStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowInstance" (
    "id" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "currentStepId" TEXT,
    "state" "WorkflowState" NOT NULL DEFAULT 'NOT_STARTED',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkflowInstance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowExecution" (
    "id" TEXT NOT NULL,
    "instanceId" TEXT NOT NULL,
    "stepId" TEXT,
    "action" "WorkflowAction" NOT NULL,
    "performedById" TEXT NOT NULL,
    "fromUserId" TEXT,
    "toUserId" TEXT,
    "remarks" TEXT,
    "metadata" JSONB,
    "executedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkflowExecution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FileMinute" (
    "id" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "parentMinuteId" TEXT,
    "minuteType" "MinuteType" NOT NULL DEFAULT 'INSTRUCTION',
    "content" TEXT NOT NULL,
    "writtenById" TEXT NOT NULL,
    "addressedToId" TEXT,
    "workflowExecutionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    "deletedById" TEXT,

    CONSTRAINT "FileMinute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FileComment" (
    "id" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "parentCommentId" TEXT,
    "content" TEXT NOT NULL,
    "visibility" "CommentVisibility" NOT NULL DEFAULT 'INTERNAL',
    "authorId" TEXT NOT NULL,
    "isEdited" BOOLEAN NOT NULL DEFAULT false,
    "editedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "deletedById" TEXT,

    CONSTRAINT "FileComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FileHistory" (
    "id" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "fieldName" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "changeReason" TEXT,
    "changedById" TEXT,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FileHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimelineEvent" (
    "id" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "eventType" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT,
    "actorId" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TimelineEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FileActivity" (
    "id" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "userId" TEXT,
    "activityType" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FileActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "fileId" TEXT,
    "triggeredById" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationRecipient" (
    "id" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL DEFAULT 'IN_APP',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "isSent" BOOLEAN NOT NULL DEFAULT false,
    "sentAt" TIMESTAMP(3),
    "deliveryStatus" TEXT,
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationRecipient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArchiveRecord" (
    "id" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "status" "ArchiveStatus" NOT NULL DEFAULT 'ACTIVE',
    "archivedById" TEXT,
    "archivedAt" TIMESTAMP(3),
    "retentionYears" INTEGER,
    "retentionExpiresAt" TIMESTAMP(3),
    "storageLocation" TEXT,
    "restoredById" TEXT,
    "restoredAt" TIMESTAMP(3),
    "destructionApprovedById" TEXT,
    "destructionDate" TIMESTAMP(3),
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArchiveRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FileCategory_code_key" ON "FileCategory"("code");

-- CreateIndex
CREATE INDEX "FileCategory_parentId_idx" ON "FileCategory"("parentId");

-- CreateIndex
CREATE INDEX "FileCategory_code_idx" ON "FileCategory"("code");

-- CreateIndex
CREATE UNIQUE INDEX "FileCategory_parentId_code_key" ON "FileCategory"("parentId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "FileTag_name_key" ON "FileTag"("name");

-- CreateIndex
CREATE INDEX "FileTagMapping_tagId_idx" ON "FileTagMapping"("tagId");

-- CreateIndex
CREATE UNIQUE INDEX "Citizen_citizenNumber_key" ON "Citizen"("citizenNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Citizen_nationalId_key" ON "Citizen"("nationalId");

-- CreateIndex
CREATE INDEX "Citizen_phoneNumber_idx" ON "Citizen"("phoneNumber");

-- CreateIndex
CREATE INDEX "Citizen_nationalId_idx" ON "Citizen"("nationalId");

-- CreateIndex
CREATE INDEX "Citizen_fullName_idx" ON "Citizen"("fullName");

-- CreateIndex
CREATE UNIQUE INDEX "File_fileNumber_key" ON "File"("fileNumber");

-- CreateIndex
CREATE UNIQUE INDEX "File_registryNumber_key" ON "File"("registryNumber");

-- CreateIndex
CREATE UNIQUE INDEX "File_trackingNumber_key" ON "File"("trackingNumber");

-- CreateIndex
CREATE INDEX "File_status_idx" ON "File"("status");

-- CreateIndex
CREATE INDEX "File_priority_idx" ON "File"("priority");

-- CreateIndex
CREATE INDEX "File_departmentId_idx" ON "File"("departmentId");

-- CreateIndex
CREATE INDEX "File_categoryId_idx" ON "File"("categoryId");

-- CreateIndex
CREATE INDEX "File_citizenId_idx" ON "File"("citizenId");

-- CreateIndex
CREATE INDEX "File_registeredById_idx" ON "File"("registeredById");

-- CreateIndex
CREATE INDEX "File_createdAt_idx" ON "File"("createdAt");

-- CreateIndex
CREATE INDEX "File_dueDate_idx" ON "File"("dueDate");

-- CreateIndex
CREATE INDEX "File_deletedAt_idx" ON "File"("deletedAt");

-- CreateIndex
CREATE INDEX "FileReference_fileId_idx" ON "FileReference"("fileId");

-- CreateIndex
CREATE INDEX "FileReference_referencedFileId_idx" ON "FileReference"("referencedFileId");

-- CreateIndex
CREATE UNIQUE INDEX "FileReference_fileId_referencedFileId_referenceType_key" ON "FileReference"("fileId", "referencedFileId", "referenceType");

-- CreateIndex
CREATE INDEX "FileWatcher_userId_idx" ON "FileWatcher"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Correspondence_correspondenceNumber_key" ON "Correspondence"("correspondenceNumber");

-- CreateIndex
CREATE INDEX "Correspondence_fileId_idx" ON "Correspondence"("fileId");

-- CreateIndex
CREATE INDEX "Correspondence_citizenId_idx" ON "Correspondence"("citizenId");

-- CreateIndex
CREATE INDEX "Correspondence_type_idx" ON "Correspondence"("type");

-- CreateIndex
CREATE INDEX "Correspondence_correspondenceDate_idx" ON "Correspondence"("correspondenceDate");

-- CreateIndex
CREATE UNIQUE INDEX "IncomingLetter_correspondenceId_key" ON "IncomingLetter"("correspondenceId");

-- CreateIndex
CREATE INDEX "IncomingLetter_receivedDate_idx" ON "IncomingLetter"("receivedDate");

-- CreateIndex
CREATE UNIQUE INDEX "OutgoingLetter_correspondenceId_key" ON "OutgoingLetter"("correspondenceId");

-- CreateIndex
CREATE INDEX "OutgoingLetter_dispatchDate_idx" ON "OutgoingLetter"("dispatchDate");

-- CreateIndex
CREATE UNIQUE INDEX "FileAttachment_currentVersionId_key" ON "FileAttachment"("currentVersionId");

-- CreateIndex
CREATE INDEX "FileAttachment_fileId_idx" ON "FileAttachment"("fileId");

-- CreateIndex
CREATE INDEX "FileAttachment_correspondenceId_idx" ON "FileAttachment"("correspondenceId");

-- CreateIndex
CREATE INDEX "FileAttachment_minuteId_idx" ON "FileAttachment"("minuteId");

-- CreateIndex
CREATE INDEX "FileAttachment_attachmentType_idx" ON "FileAttachment"("attachmentType");

-- CreateIndex
CREATE INDEX "FileAttachment_deletedAt_idx" ON "FileAttachment"("deletedAt");

-- CreateIndex
CREATE INDEX "FileVersion_attachmentId_idx" ON "FileVersion"("attachmentId");

-- CreateIndex
CREATE INDEX "FileVersion_checksum_idx" ON "FileVersion"("checksum");

-- CreateIndex
CREATE UNIQUE INDEX "FileVersion_attachmentId_versionNumber_key" ON "FileVersion"("attachmentId", "versionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "FileMovement_workflowExecutionId_key" ON "FileMovement"("workflowExecutionId");

-- CreateIndex
CREATE INDEX "FileMovement_fileId_idx" ON "FileMovement"("fileId");

-- CreateIndex
CREATE INDEX "FileMovement_toUserId_idx" ON "FileMovement"("toUserId");

-- CreateIndex
CREATE INDEX "FileMovement_fromUserId_idx" ON "FileMovement"("fromUserId");

-- CreateIndex
CREATE INDEX "FileMovement_status_idx" ON "FileMovement"("status");

-- CreateIndex
CREATE INDEX "FileMovement_dispatchedAt_idx" ON "FileMovement"("dispatchedAt");

-- CreateIndex
CREATE INDEX "FileAssignment_fileId_idx" ON "FileAssignment"("fileId");

-- CreateIndex
CREATE INDEX "FileAssignment_assignedToId_idx" ON "FileAssignment"("assignedToId");

-- CreateIndex
CREATE INDEX "FileAssignment_assignedDepartmentId_idx" ON "FileAssignment"("assignedDepartmentId");

-- CreateIndex
CREATE INDEX "FileAssignment_status_idx" ON "FileAssignment"("status");

-- CreateIndex
CREATE INDEX "FileAssignment_isCurrent_idx" ON "FileAssignment"("isCurrent");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowTemplate_code_key" ON "WorkflowTemplate"("code");

-- CreateIndex
CREATE INDEX "WorkflowTemplate_categoryId_idx" ON "WorkflowTemplate"("categoryId");

-- CreateIndex
CREATE INDEX "WorkflowTemplate_departmentId_idx" ON "WorkflowTemplate"("departmentId");

-- CreateIndex
CREATE INDEX "WorkflowStep_templateId_idx" ON "WorkflowStep"("templateId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowStep_templateId_stepOrder_key" ON "WorkflowStep"("templateId", "stepOrder");

-- CreateIndex
CREATE INDEX "WorkflowInstance_fileId_idx" ON "WorkflowInstance"("fileId");

-- CreateIndex
CREATE INDEX "WorkflowInstance_templateId_idx" ON "WorkflowInstance"("templateId");

-- CreateIndex
CREATE INDEX "WorkflowInstance_currentStepId_idx" ON "WorkflowInstance"("currentStepId");

-- CreateIndex
CREATE INDEX "WorkflowInstance_state_idx" ON "WorkflowInstance"("state");

-- CreateIndex
CREATE INDEX "WorkflowExecution_instanceId_idx" ON "WorkflowExecution"("instanceId");

-- CreateIndex
CREATE INDEX "WorkflowExecution_stepId_idx" ON "WorkflowExecution"("stepId");

-- CreateIndex
CREATE INDEX "WorkflowExecution_action_idx" ON "WorkflowExecution"("action");

-- CreateIndex
CREATE INDEX "WorkflowExecution_performedById_idx" ON "WorkflowExecution"("performedById");

-- CreateIndex
CREATE INDEX "WorkflowExecution_executedAt_idx" ON "WorkflowExecution"("executedAt");

-- CreateIndex
CREATE INDEX "FileMinute_fileId_idx" ON "FileMinute"("fileId");

-- CreateIndex
CREATE INDEX "FileMinute_parentMinuteId_idx" ON "FileMinute"("parentMinuteId");

-- CreateIndex
CREATE INDEX "FileMinute_writtenById_idx" ON "FileMinute"("writtenById");

-- CreateIndex
CREATE INDEX "FileMinute_addressedToId_idx" ON "FileMinute"("addressedToId");

-- CreateIndex
CREATE INDEX "FileMinute_workflowExecutionId_idx" ON "FileMinute"("workflowExecutionId");

-- CreateIndex
CREATE INDEX "FileComment_fileId_idx" ON "FileComment"("fileId");

-- CreateIndex
CREATE INDEX "FileComment_authorId_idx" ON "FileComment"("authorId");

-- CreateIndex
CREATE INDEX "FileComment_parentCommentId_idx" ON "FileComment"("parentCommentId");

-- CreateIndex
CREATE INDEX "FileHistory_fileId_idx" ON "FileHistory"("fileId");

-- CreateIndex
CREATE INDEX "FileHistory_fieldName_idx" ON "FileHistory"("fieldName");

-- CreateIndex
CREATE INDEX "FileHistory_changedAt_idx" ON "FileHistory"("changedAt");

-- CreateIndex
CREATE INDEX "TimelineEvent_fileId_idx" ON "TimelineEvent"("fileId");

-- CreateIndex
CREATE INDEX "TimelineEvent_occurredAt_idx" ON "TimelineEvent"("occurredAt");

-- CreateIndex
CREATE INDEX "TimelineEvent_sourceType_sourceId_idx" ON "TimelineEvent"("sourceType", "sourceId");

-- CreateIndex
CREATE INDEX "FileActivity_fileId_idx" ON "FileActivity"("fileId");

-- CreateIndex
CREATE INDEX "FileActivity_userId_idx" ON "FileActivity"("userId");

-- CreateIndex
CREATE INDEX "FileActivity_activityType_idx" ON "FileActivity"("activityType");

-- CreateIndex
CREATE INDEX "FileActivity_occurredAt_idx" ON "FileActivity"("occurredAt");

-- CreateIndex
CREATE INDEX "Notification_type_idx" ON "Notification"("type");

-- CreateIndex
CREATE INDEX "Notification_fileId_idx" ON "Notification"("fileId");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE INDEX "NotificationRecipient_userId_idx" ON "NotificationRecipient"("userId");

-- CreateIndex
CREATE INDEX "NotificationRecipient_isRead_idx" ON "NotificationRecipient"("isRead");

-- CreateIndex
CREATE INDEX "NotificationRecipient_channel_idx" ON "NotificationRecipient"("channel");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationRecipient_notificationId_userId_channel_key" ON "NotificationRecipient"("notificationId", "userId", "channel");

-- CreateIndex
CREATE INDEX "NotificationPreference_userId_idx" ON "NotificationPreference"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPreference_userId_type_channel_key" ON "NotificationPreference"("userId", "type", "channel");

-- CreateIndex
CREATE UNIQUE INDEX "ArchiveRecord_fileId_key" ON "ArchiveRecord"("fileId");

-- CreateIndex
CREATE INDEX "ArchiveRecord_status_idx" ON "ArchiveRecord"("status");

-- CreateIndex
CREATE INDEX "ArchiveRecord_retentionExpiresAt_idx" ON "ArchiveRecord"("retentionExpiresAt");

-- AddForeignKey
ALTER TABLE "FileCategory" ADD CONSTRAINT "FileCategory_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "FileCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileTagMapping" ADD CONSTRAINT "FileTagMapping_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileTagMapping" ADD CONSTRAINT "FileTagMapping_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "FileTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileTagMapping" ADD CONSTRAINT "FileTagMapping_taggedById_fkey" FOREIGN KEY ("taggedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Citizen" ADD CONSTRAINT "Citizen_registeredById_fkey" FOREIGN KEY ("registeredById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "FileCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "Citizen"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_registeredById_fkey" FOREIGN KEY ("registeredById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileReference" ADD CONSTRAINT "FileReference_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileReference" ADD CONSTRAINT "FileReference_referencedFileId_fkey" FOREIGN KEY ("referencedFileId") REFERENCES "File"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileReference" ADD CONSTRAINT "FileReference_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileWatcher" ADD CONSTRAINT "FileWatcher_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileWatcher" ADD CONSTRAINT "FileWatcher_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Correspondence" ADD CONSTRAINT "Correspondence_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Correspondence" ADD CONSTRAINT "Correspondence_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "Citizen"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncomingLetter" ADD CONSTRAINT "IncomingLetter_correspondenceId_fkey" FOREIGN KEY ("correspondenceId") REFERENCES "Correspondence"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncomingLetter" ADD CONSTRAINT "IncomingLetter_receivedById_fkey" FOREIGN KEY ("receivedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutgoingLetter" ADD CONSTRAINT "OutgoingLetter_correspondenceId_fkey" FOREIGN KEY ("correspondenceId") REFERENCES "Correspondence"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutgoingLetter" ADD CONSTRAINT "OutgoingLetter_dispatchedById_fkey" FOREIGN KEY ("dispatchedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileAttachment" ADD CONSTRAINT "FileAttachment_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileAttachment" ADD CONSTRAINT "FileAttachment_correspondenceId_fkey" FOREIGN KEY ("correspondenceId") REFERENCES "Correspondence"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileAttachment" ADD CONSTRAINT "FileAttachment_minuteId_fkey" FOREIGN KEY ("minuteId") REFERENCES "FileMinute"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileAttachment" ADD CONSTRAINT "FileAttachment_currentVersionId_fkey" FOREIGN KEY ("currentVersionId") REFERENCES "FileVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileAttachment" ADD CONSTRAINT "FileAttachment_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileVersion" ADD CONSTRAINT "FileVersion_attachmentId_fkey" FOREIGN KEY ("attachmentId") REFERENCES "FileAttachment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileVersion" ADD CONSTRAINT "FileVersion_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileMovement" ADD CONSTRAINT "FileMovement_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileMovement" ADD CONSTRAINT "FileMovement_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileMovement" ADD CONSTRAINT "FileMovement_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileMovement" ADD CONSTRAINT "FileMovement_fromDepartmentId_fkey" FOREIGN KEY ("fromDepartmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileMovement" ADD CONSTRAINT "FileMovement_toDepartmentId_fkey" FOREIGN KEY ("toDepartmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileMovement" ADD CONSTRAINT "FileMovement_workflowExecutionId_fkey" FOREIGN KEY ("workflowExecutionId") REFERENCES "WorkflowExecution"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileAssignment" ADD CONSTRAINT "FileAssignment_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileAssignment" ADD CONSTRAINT "FileAssignment_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileAssignment" ADD CONSTRAINT "FileAssignment_assignedDepartmentId_fkey" FOREIGN KEY ("assignedDepartmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileAssignment" ADD CONSTRAINT "FileAssignment_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileAssignment" ADD CONSTRAINT "FileAssignment_workflowStepId_fkey" FOREIGN KEY ("workflowStepId") REFERENCES "WorkflowStep"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowTemplate" ADD CONSTRAINT "WorkflowTemplate_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "FileCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowTemplate" ADD CONSTRAINT "WorkflowTemplate_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowStep" ADD CONSTRAINT "WorkflowStep_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "WorkflowTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowStep" ADD CONSTRAINT "WorkflowStep_requiredPositionId_fkey" FOREIGN KEY ("requiredPositionId") REFERENCES "Position"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowStep" ADD CONSTRAINT "WorkflowStep_requiredRoleId_fkey" FOREIGN KEY ("requiredRoleId") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowInstance" ADD CONSTRAINT "WorkflowInstance_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowInstance" ADD CONSTRAINT "WorkflowInstance_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "WorkflowTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowInstance" ADD CONSTRAINT "WorkflowInstance_currentStepId_fkey" FOREIGN KEY ("currentStepId") REFERENCES "WorkflowStep"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowExecution" ADD CONSTRAINT "WorkflowExecution_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "WorkflowInstance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowExecution" ADD CONSTRAINT "WorkflowExecution_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "WorkflowStep"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowExecution" ADD CONSTRAINT "WorkflowExecution_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowExecution" ADD CONSTRAINT "WorkflowExecution_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowExecution" ADD CONSTRAINT "WorkflowExecution_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileMinute" ADD CONSTRAINT "FileMinute_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileMinute" ADD CONSTRAINT "FileMinute_parentMinuteId_fkey" FOREIGN KEY ("parentMinuteId") REFERENCES "FileMinute"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileMinute" ADD CONSTRAINT "FileMinute_writtenById_fkey" FOREIGN KEY ("writtenById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileMinute" ADD CONSTRAINT "FileMinute_addressedToId_fkey" FOREIGN KEY ("addressedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileMinute" ADD CONSTRAINT "FileMinute_workflowExecutionId_fkey" FOREIGN KEY ("workflowExecutionId") REFERENCES "WorkflowExecution"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileMinute" ADD CONSTRAINT "FileMinute_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileComment" ADD CONSTRAINT "FileComment_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileComment" ADD CONSTRAINT "FileComment_parentCommentId_fkey" FOREIGN KEY ("parentCommentId") REFERENCES "FileComment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileComment" ADD CONSTRAINT "FileComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileComment" ADD CONSTRAINT "FileComment_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileHistory" ADD CONSTRAINT "FileHistory_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileHistory" ADD CONSTRAINT "FileHistory_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimelineEvent" ADD CONSTRAINT "TimelineEvent_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimelineEvent" ADD CONSTRAINT "TimelineEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileActivity" ADD CONSTRAINT "FileActivity_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileActivity" ADD CONSTRAINT "FileActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_triggeredById_fkey" FOREIGN KEY ("triggeredById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationRecipient" ADD CONSTRAINT "NotificationRecipient_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "Notification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationRecipient" ADD CONSTRAINT "NotificationRecipient_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationPreference" ADD CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArchiveRecord" ADD CONSTRAINT "ArchiveRecord_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArchiveRecord" ADD CONSTRAINT "ArchiveRecord_archivedById_fkey" FOREIGN KEY ("archivedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArchiveRecord" ADD CONSTRAINT "ArchiveRecord_restoredById_fkey" FOREIGN KEY ("restoredById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArchiveRecord" ADD CONSTRAINT "ArchiveRecord_destructionApprovedById_fkey" FOREIGN KEY ("destructionApprovedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
