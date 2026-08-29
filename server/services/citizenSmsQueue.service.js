import * as citizenSmsMessageRepository from "../repositories/citizenSmsMessage.repository.js";
import { sendSms } from "./sms.service.js";

const BASE_BACKOFF_MS = 60_000; // 1 minute, doubled per attempt
const BATCH_SIZE = 20;

const computeBackoff = (attempts) => new Date(Date.now() + BASE_BACKOFF_MS * 2 ** attempts);

/**
 * Dispatches every due CitizenSmsMessage (PENDING, or FAILED whose backoff
 * window has elapsed) over the SMS channel. Runs on the same schedule as
 * the staff NotificationQueue (see notificationQueue.cron.js), never inline
 * with the request that triggered it.
 */
export const processCitizenSmsQueue = async () => {
  const items = await citizenSmsMessageRepository.findDueQueueItems(BATCH_SIZE);
  let sent = 0;
  let failed = 0;

  for (const item of items) {
    await citizenSmsMessageRepository.markProcessing(item.id);

    try {
      if (!item.phoneNumber) throw new Error("Citizen has no phone number on file");
      await sendSms(item.phoneNumber, item.message);

      await citizenSmsMessageRepository.markSent(item.id);
      sent += 1;
    } catch (err) {
      const attempts = item.attempts + 1;
      const lastError = (err.message ?? "Unknown error").slice(0, 500);

      if (attempts >= item.maxAttempts) {
        await citizenSmsMessageRepository.markDeadLetter(item.id, { attempts, lastError });
      } else {
        await citizenSmsMessageRepository.markRetry(item.id, { attempts, nextAttemptAt: computeBackoff(attempts), lastError });
      }
      failed += 1;
    }
  }

  return { processed: items.length, sent, failed };
};
