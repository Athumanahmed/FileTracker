import { body, param, query } from "express-validator";

const NOTIFICATION_TYPES = [
  "FILE_REGISTERED",
  "FILE_ASSIGNED",
  "FILE_FORWARDED",
  "FILE_RETURNED",
  "FILE_APPROVED",
  "FILE_REJECTED",
  "FILE_ON_HOLD",
  "FILE_RESUMED",
  "FILE_COMPLETED",
  "FILE_CLOSED",
  "FILE_ARCHIVED",
  "FILE_INFORMATION_REQUESTED",
  "MINUTE_ADDED",
  "COMMENT_ADDED",
  "ATTACHMENT_UPLOADED",
  "ATTACHMENT_REPLACED",
  "ATTACHMENT_DELETED",
  "DEADLINE_APPROACHING",
  "DEADLINE_OVERDUE",
  "SYSTEM_ALERT",
];

const NOTIFICATION_CHANNELS = ["IN_APP", "SMS", "EMAIL", "PUSH"];

export const listNotificationsValidationRules = [
  query("page").optional().isInt({ min: 1 }),
  query("limit").optional().isInt({ min: 1, max: 100 }),
  query("isRead").optional().isIn(["true", "false"]),
];

export const notificationIdParamValidationRules = [param("id").trim().notEmpty().withMessage("id is required")];

export const setPreferenceValidationRules = [
  body("type").trim().isIn(NOTIFICATION_TYPES).withMessage(`type must be one of ${NOTIFICATION_TYPES.join(", ")}`),
  body("channel").trim().isIn(NOTIFICATION_CHANNELS).withMessage(`channel must be one of ${NOTIFICATION_CHANNELS.join(", ")}`),
  body("isEnabled").isBoolean().withMessage("isEnabled must be a boolean"),
];
