import prisma from "../config/prisma.js";

export const create = (data) => prisma.notification.create({ data });

export const createRecipient = (data) => prisma.notificationRecipient.create({ data });

export const markRecipientSent = (id, deliveryStatus = "SENT") =>
  prisma.notificationRecipient.update({
    where: { id },
    data: { isSent: true, sentAt: new Date(), deliveryStatus },
  });

export const markRecipientFailed = (id, failureReason) =>
  prisma.notificationRecipient.update({
    where: { id },
    data: { deliveryStatus: "FAILED", failureReason },
  });

// ---------------------------------------------------------------------
// Recipient inbox (user-facing)
// ---------------------------------------------------------------------

const NOTIFICATION_INCLUDE = {
  notification: {
    select: { id: true, type: true, title: true, message: true, fileId: true, createdAt: true },
  },
};

export const findByUser = ({ userId, where, skip, take }) =>
  prisma.notificationRecipient.findMany({
    where: { userId, channel: "IN_APP", ...where },
    include: NOTIFICATION_INCLUDE,
    orderBy: { createdAt: "desc" },
    skip,
    take,
  });

export const countByUser = (userId, where) =>
  prisma.notificationRecipient.count({ where: { userId, channel: "IN_APP", ...where } });

export const countUnreadByUser = (userId) =>
  prisma.notificationRecipient.count({ where: { userId, channel: "IN_APP", isRead: false } });

export const findRecipientById = (id) => prisma.notificationRecipient.findUnique({ where: { id }, include: NOTIFICATION_INCLUDE });

export const markRead = (id) => prisma.notificationRecipient.update({ where: { id }, data: { isRead: true, readAt: new Date() } });

export const markAllReadForUser = (userId) =>
  prisma.notificationRecipient.updateMany({
    where: { userId, channel: "IN_APP", isRead: false },
    data: { isRead: true, readAt: new Date() },
  });

// ---------------------------------------------------------------------
// NotificationQueue (SMS dispatch/retry mechanics)
// ---------------------------------------------------------------------

export const enqueue = (notificationRecipientId) => prisma.notificationQueue.create({ data: { notificationRecipientId } });

const QUEUE_ITEM_INCLUDE = {
  notificationRecipient: {
    include: {
      user: { select: { id: true, fullName: true, phoneNumber: true } },
      notification: { select: { title: true, message: true } },
    },
  },
};

/** Due for dispatch: PENDING or a previously-FAILED attempt whose backoff window has elapsed. */
export const findDueQueueItems = (limit) =>
  prisma.notificationQueue.findMany({
    where: { status: { in: ["PENDING", "FAILED"] }, nextAttemptAt: { lte: new Date() } },
    include: QUEUE_ITEM_INCLUDE,
    orderBy: { nextAttemptAt: "asc" },
    take: limit,
  });

export const markQueueProcessing = (id) => prisma.notificationQueue.update({ where: { id }, data: { status: "PROCESSING" } });

export const markQueueSent = (id) => prisma.notificationQueue.update({ where: { id }, data: { status: "SENT" } });

export const markQueueRetry = (id, { attempts, nextAttemptAt, lastError }) =>
  prisma.notificationQueue.update({ where: { id }, data: { status: "FAILED", attempts, nextAttemptAt, lastError } });

export const markQueueDeadLetter = (id, { attempts, lastError }) =>
  prisma.notificationQueue.update({ where: { id }, data: { status: "DEAD_LETTER", attempts, lastError } });
