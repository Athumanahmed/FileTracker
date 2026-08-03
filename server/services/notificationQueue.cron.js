import cron from "node-cron";
import { processNotificationQueue } from "./notificationQueue.service.js";

// 6-field pattern (seconds granularity) -- SMS delivery should feel
// near-real-time, not wait for the next minute boundary.
const SCHEDULE = process.env.NOTIFICATION_QUEUE_CRON || "*/30 * * * * *";

/** Polls NotificationQueue on a schedule and dispatches due SMS jobs. Registered once at boot (see server.js). */
export const registerNotificationQueueCron = () => {
  cron.schedule(SCHEDULE, async () => {
    try {
      await processNotificationQueue();
    } catch (err) {
      console.error("Notification queue processing failed:", err);
    }
  });
};
