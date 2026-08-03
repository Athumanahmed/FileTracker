import * as notificationRepository from "../repositories/notification.repository.js";
import { sendSms } from "./sms.service.js";

const BASE_BACKOFF_MS = 60_000; // 1 minute, doubled per attempt
const BATCH_SIZE = 20;

const computeBackoff = (attempts) => new Date(Date.now() + BASE_BACKOFF_MS * 2 ** attempts);

/**
 * Dispatches every due NotificationQueue item (PENDING, or FAILED whose
 * backoff window has elapsed) via the SMS channel. Called on a schedule
 * (see notificationQueue.cron.js), never inline with the request that
 * triggered the notification -- a slow/down SMS provider must never
 * block an API response.
 */
export const processNotificationQueue = async () => {
  const items = await notificationRepository.findDueQueueItems(BATCH_SIZE);
  let sent = 0;
  let failed = 0;

  for (const item of items) {
    await notificationRepository.markQueueProcessing(item.id);

    const { user, notification } = item.notificationRecipient;

    try {
      if (!user.phoneNumber) throw new Error("Recipient has no phone number on file");
      await sendSms(user.phoneNumber, `${notification.title}: ${notification.message}`);

      await notificationRepository.markQueueSent(item.id);
      await notificationRepository.markRecipientSent(item.notificationRecipientId, "SENT");
      sent += 1;
    } catch (err) {
      const attempts = item.attempts + 1;
      const lastError = (err.message ?? "Unknown error").slice(0, 500);

      if (attempts >= item.maxAttempts) {
        await notificationRepository.markQueueDeadLetter(item.id, { attempts, lastError });
        await notificationRepository.markRecipientFailed(item.notificationRecipientId, lastError);
      } else {
        await notificationRepository.markQueueRetry(item.id, { attempts, nextAttemptAt: computeBackoff(attempts), lastError });
      }
      failed += 1;
    }
  }

  return { processed: items.length, sent, failed };
};
