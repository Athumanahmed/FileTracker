import prisma from "../config/prisma.js";

/**
 * Data-access for CitizenSmsMessage -- the citizen-facing SMS milestone
 * queue. Same dispatch mechanics as NotificationQueue (see
 * notification.repository.js), just a standalone record because a Citizen
 * is not a User.
 */

export const existsForFileEvent = async (fileId, eventKey) =>
  (await prisma.citizenSmsMessage.count({ where: { fileId, eventKey } })) > 0;

export const enqueue = (data) => prisma.citizenSmsMessage.create({ data });

/** Due for dispatch: PENDING, or a previously-FAILED attempt whose backoff window has elapsed. */
export const findDueQueueItems = (limit) =>
  prisma.citizenSmsMessage.findMany({
    where: { status: { in: ["PENDING", "FAILED"] }, nextAttemptAt: { lte: new Date() } },
    orderBy: { nextAttemptAt: "asc" },
    take: limit,
  });

export const markProcessing = (id) =>
  prisma.citizenSmsMessage.update({ where: { id }, data: { status: "PROCESSING" } });

export const markSent = (id) =>
  prisma.citizenSmsMessage.update({ where: { id }, data: { status: "SENT", sentAt: new Date() } });

export const markRetry = (id, { attempts, nextAttemptAt, lastError }) =>
  prisma.citizenSmsMessage.update({ where: { id }, data: { status: "FAILED", attempts, nextAttemptAt, lastError } });

export const markDeadLetter = (id, { attempts, lastError }) =>
  prisma.citizenSmsMessage.update({ where: { id }, data: { status: "DEAD_LETTER", attempts, lastError } });
