import { query, param } from "express-validator";

const EVENT_TYPES = [
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

export const listTimelineValidationRules = [
  param("fileId").trim().notEmpty().withMessage("fileId is required"),
  query("page").optional().isInt({ min: 1 }),
  query("limit").optional().isInt({ min: 1, max: 100 }),
  query("eventType").optional().isIn(EVENT_TYPES).withMessage(`eventType must be one of ${EVENT_TYPES.join(", ")}`),
  query("fromDate").optional().isISO8601().withMessage("fromDate must be a valid date"),
  query("toDate").optional().isISO8601().withMessage("toDate must be a valid date"),
  query("sortOrder").optional().isIn(["asc", "desc"]),
];
