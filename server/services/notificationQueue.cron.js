import cron from "node-cron";
import { processNotificationQueue } from "./notificationQueue.service.js";
import { processCitizenSmsQueue } from "./citizenSmsQueue.service.js";

// 6-field pattern (seconds granularity) -- SMS delivery should feel
// near-real-time, not wait for the next minute boundary.
const SCHEDULE = process.env.NOTIFICATION_QUEUE_CRON || "*/30 * * * * *";

/**
 * Polls the SMS dispatch queues on a schedule and sends due jobs. One tick
 * drains both the staff NotificationQueue and the citizen CitizenSmsMessage
 * queue -- each in its own try/catch so a failure in one never starves the
 * other. Registered once at boot (see server.js).
 */
export const registerNotificationQueueCron = () => {
  cron.schedule(SCHEDULE, async () => {
    try {
      await processNotificationQueue();
    } catch (err) {
      console.error("Notification queue processing failed:", err);
    }
    try {
      await processCitizenSmsQueue();
    } catch (err) {
      console.error("Citizen SMS queue processing failed:", err);
    }
  });
};
