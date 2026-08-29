import { body, query } from "express-validator";

const PRIORITY_LEVELS = ["LOW", "NORMAL", "HIGH", "URGENT", "CRITICAL"];
const CONFIDENTIALITY_LEVELS = ["PUBLIC", "INTERNAL", "CONFIDENTIAL", "SECRET", "TOP_SECRET"];
const FILE_SOURCES = ["WALK_IN", "POST", "EMAIL", "FAX", "PORTAL", "INTERNAL", "COURIER", "HAND_DELIVERY"];
const FILE_STATUSES = [
  "DRAFT",
  "REGISTERED",
  "IN_PROGRESS",
  "PENDING_ACTION",
  "ON_HOLD",
  "FORWARDED",
  "RETURNED",
  "APPROVED",
  "REJECTED",
  "COMPLETED",
  "ARCHIVED",
  "CLOSED",
];

// multipart/form-data has no nested-object support, so the citizen record
// (when the file isn't linked to an existing one) travels as a JSON string
// in a single text field and is parsed in the controller.
const citizenJsonRule = body("citizen")
  .optional({ checkFalsy: true })
  .custom((value) => {
    let parsed;
    try {
      parsed = JSON.parse(value);
    } catch {
      throw new Error("citizen must be a valid JSON object");
    }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("citizen must be a JSON object");
    }
    if (!parsed.firstName || !parsed.lastName) {
      throw new Error("citizen.firstName and citizen.lastName are required");
    }
    if (parsed.smsNotificationsEnabled !== undefined && typeof parsed.smsNotificationsEnabled !== "boolean") {
      throw new Error("citizen.smsNotificationsEnabled must be a boolean");
    }
    return true;
  });

export const registerFileValidationRules = [
  body("title").trim().notEmpty().withMessage("Title is required").isLength({ max: 500 }),
  body("description").optional({ checkFalsy: true }).trim().isLength({ max: 2000 }),
  body("categoryId").trim().notEmpty().withMessage("categoryId is required"),
  body("departmentId").trim().notEmpty().withMessage("departmentId is required"),
  body("priority").optional().isIn(PRIORITY_LEVELS).withMessage(`priority must be one of ${PRIORITY_LEVELS.join(", ")}`),
  body("confidentiality")
    .optional()
    .isIn(CONFIDENTIALITY_LEVELS)
    .withMessage(`confidentiality must be one of ${CONFIDENTIALITY_LEVELS.join(", ")}`),
  body("source").optional().isIn(FILE_SOURCES).withMessage(`source must be one of ${FILE_SOURCES.join(", ")}`),
  body("dueDate").optional({ checkFalsy: true }).isISO8601().withMessage("dueDate must be a valid date"),
  body("citizenId").optional({ checkFalsy: true }).trim(),
  citizenJsonRule,
];

// Advanced Search (Phase 9) -- the full criteria set on top of the base
// list: citizen, phone, current owner, and a created-date range.
export const listFilesValidationRules = [
  query("page").optional().isInt({ min: 1 }),
  query("limit").optional().isInt({ min: 1, max: 100 }),
  query("search").optional().trim().isLength({ max: 100 }),
  query("status").optional().isIn(FILE_STATUSES),
  query("priority").optional().isIn(PRIORITY_LEVELS),
  query("confidentiality").optional().isIn(CONFIDENTIALITY_LEVELS),
  query("departmentId").optional().trim(),
  query("categoryId").optional().trim(),
  query("citizenId").optional().trim(),
  query("citizenPhone").optional().trim().isLength({ max: 20 }),
  query("assignedToId").optional().trim(),
  query("dateFrom").optional().isISO8601().withMessage("dateFrom must be a valid date"),
  query("dateTo").optional().isISO8601().withMessage("dateTo must be a valid date"),
  query("sortBy").optional().isIn(["fileNumber", "registryNumber", "trackingNumber", "title", "createdAt", "updatedAt", "priority", "status", "dueDate"]),
  query("sortOrder").optional().isIn(["asc", "desc"]),
];
