import { AppError } from "../utils/AppError.js";
import { subscribe } from "../utils/eventBus.js";
import { parsePagination, buildPaginationMeta, parseBooleanFilter } from "../utils/queryOptions.js";
import * as notificationRepository from "../repositories/notification.repository.js";
import * as notificationPreferenceRepository from "../repositories/notificationPreference.repository.js";

/** No preference row for a (user, type) pair defaults to IN_APP only -- SMS is opt-in, never a silent default for a channel that costs money and touches someone's phone. */
const resolveEnabledChannels = async (userId, eventType) => {
  const preferences = await notificationPreferenceRepository.findByUserAndType(userId, eventType);
  if (preferences.length === 0) return ["IN_APP"];
  return preferences.filter((p) => p.isEnabled).map((p) => p.channel);
};

const fanOutToUser = async ({ notification, userId, eventType }) => {
  const channels = await resolveEnabledChannels(userId, eventType);

  for (const channel of channels) {
    const recipient = await notificationRepository.createRecipient({
      notificationId: notification.id,
      userId,
      channel,
    });

    if (channel === "SMS") {
      await notificationRepository.enqueue(recipient.id);
    } else if (channel === "IN_APP") {
      // In-app is "delivered" simply by existing as an unread row -- no dispatch needed.
      await notificationRepository.markRecipientSent(recipient.id, "DELIVERED");
    }
    // EMAIL/PUSH: no transport built yet (not in this phase's scope) -- the
    // recipient row exists but is never marked sent. Future Improvement.
  }
};

/**
 * Notification's write side: turns a published domain event into a
 * Notification + fan-out NotificationRecipient rows, one per channel the
 * recipient has enabled. Only events that name explicit recipientIds
 * produce anything -- most domain events (e.g. every ATTACHMENT_UPLOADED)
 * are Timeline-only; a human is not pinged for every single one.
 */
export const registerNotificationSubscriber = () => {
  subscribe(async (event) => {
    if (!event.recipientIds?.length) return;

    const notification = await notificationRepository.create({
      type: event.type,
      title: event.title,
      message: event.description || event.title,
      fileId: event.fileId ?? null,
      triggeredById: event.actorId ?? null,
      metadata: { sourceType: event.sourceType, sourceId: event.sourceId ?? null },
    });

    const recipientIds = new Set(event.recipientIds.filter((id) => id && id !== event.actorId));
    for (const userId of recipientIds) {
      await fanOutToUser({ notification, userId, eventType: event.type });
    }
  });
};

// ---------------------------------------------------------------------
// User-facing: inbox
// ---------------------------------------------------------------------

const sanitize = (recipient) => ({
  id: recipient.id,
  type: recipient.notification.type,
  title: recipient.notification.title,
  message: recipient.notification.message,
  fileId: recipient.notification.fileId,
  isRead: recipient.isRead,
  readAt: recipient.readAt,
  createdAt: recipient.notification.createdAt,
});

/** Always scoped to the caller's own userId -- there is no "view someone else's notifications" capability, by design. */
export const listMyNotifications = async ({ userId, query }) => {
  const { page, limit, skip, take } = parsePagination(query);
  const isRead = parseBooleanFilter(query.isRead);

  const where = isRead !== undefined ? { isRead } : {};

  const [items, total, unreadCount] = await Promise.all([
    notificationRepository.findByUser({ userId, where, skip, take }),
    notificationRepository.countByUser(userId, where),
    notificationRepository.countUnreadByUser(userId),
  ]);

  return { items: items.map(sanitize), meta: { ...buildPaginationMeta(total, page, limit), unreadCount } };
};

export const markNotificationRead = async ({ id, userId }) => {
  const recipient = await notificationRepository.findRecipientById(id);
  if (!recipient || recipient.userId !== userId) throw new AppError(404, "Notification not found");

  const updated = await notificationRepository.markRead(id);
  return sanitize({ ...updated, notification: recipient.notification });
};

export const markAllNotificationsRead = async (userId) => {
  const result = await notificationRepository.markAllReadForUser(userId);
  return { updatedCount: result.count };
};

// ---------------------------------------------------------------------
// User-facing: preferences
// ---------------------------------------------------------------------

const sanitizePreference = (preference) => ({
  id: preference.id,
  type: preference.type,
  channel: preference.channel,
  isEnabled: preference.isEnabled,
});

export const listMyPreferences = async (userId) => {
  const preferences = await notificationPreferenceRepository.findByUser(userId);
  return preferences.map(sanitizePreference);
};

export const setMyPreference = async ({ userId, type, channel, isEnabled }) => {
  const preference = await notificationPreferenceRepository.upsert({ userId, type, channel, isEnabled });
  return sanitizePreference(preference);
};
