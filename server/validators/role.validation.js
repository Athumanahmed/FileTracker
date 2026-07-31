import { body, query } from "express-validator";

// Role codes are plain identifiers (e.g. HOD, SUPERVISOR), no dot-namespacing like permissions.
const CODE_REGEX = /^[A-Z0-9_]{2,50}$/;

// isSystem is intentionally not accepted on create -- see role.service.js.
export const createRoleValidationRules = [
  body("name").trim().notEmpty().withMessage("Name is required").isLength({ max: 150 }),
  body("code")
    .trim()
    .notEmpty()
    .withMessage("Code is required")
    .customSanitizer((value) => (typeof value === "string" ? value.toUpperCase() : value))
    .matches(CODE_REGEX)
    .withMessage("Code must be 2-50 uppercase letters, numbers, or underscores"),
  body("description").optional({ checkFalsy: true }).trim().isLength({ max: 500 }),
];

// code and isSystem are intentionally NOT accepted here -- both immutable
// after creation (also enforced in the service as defense-in-depth).
export const updateRoleValidationRules = [
  body("name").optional().trim().notEmpty().withMessage("Name cannot be empty").isLength({ max: 150 }),
  body("description").optional({ checkFalsy: true }).trim().isLength({ max: 500 }),
];

export const listRolesValidationRules = [
  query("page").optional().isInt({ min: 1 }).withMessage("page must be a positive integer"),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("limit must be between 1 and 100"),
  query("search").optional().trim().isLength({ max: 100 }),
  query("isActive").optional().isIn(["true", "false"]),
  query("isSystem").optional().isIn(["true", "false"]),
  query("sortBy").optional().isIn(["name", "code", "createdAt", "updatedAt"]),
  query("sortOrder").optional().isIn(["asc", "desc"]),
];
