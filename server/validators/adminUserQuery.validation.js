import { query } from "express-validator";

const USER_STATUSES = ["PENDING_ACTIVATION", "ACTIVE", "LOCKED", "SUSPENDED", "DISABLED", "ARCHIVED"];

export const listUsersValidationRules = [
  query("page").optional().isInt({ min: 1 }).withMessage("page must be a positive integer"),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("limit must be between 1 and 100"),
  query("search").optional().trim().isLength({ max: 100 }),
  query("isActive").optional().isIn(["true", "false"]),
  query("status").optional().isIn(USER_STATUSES),
  query("departmentId").optional().trim().notEmpty(),
  query("sortBy").optional().isIn(["fullName", "username", "email", "createdAt", "lastLoginAt"]),
  query("sortOrder").optional().isIn(["asc", "desc"]),
];
