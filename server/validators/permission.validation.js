import { body, query } from "express-validator";
import { MODULE_VALUES } from "../services/permission.service.js";

// Permission codes use dots as namespace separators (e.g. USERS.CREATE.HOD).
const CODE_REGEX = /^[A-Z0-9_.]{2,100}$/;

export const createPermissionValidationRules = [
  body("code")
    .trim()
    .notEmpty()
    .withMessage("Code is required")
    .customSanitizer((value) => (typeof value === "string" ? value.toUpperCase() : value))
    .matches(CODE_REGEX)
    .withMessage("Code must be 2-100 uppercase letters, numbers, dots, or underscores (e.g. USERS.CREATE)"),
  body("name").trim().notEmpty().withMessage("Name is required").isLength({ max: 150 }),
  body("module")
    .trim()
    .notEmpty()
    .withMessage("module is required")
    .isIn(MODULE_VALUES)
    .withMessage(`module must be one of: ${MODULE_VALUES.join(", ")}`),
  body("description").optional({ checkFalsy: true }).trim().isLength({ max: 500 }),
];

// code is intentionally NOT accepted on update -- immutable, see permission.service.js.
export const updatePermissionValidationRules = [
  body("name").optional().trim().notEmpty().withMessage("Name cannot be empty").isLength({ max: 150 }),
  body("module")
    .optional()
    .trim()
    .isIn(MODULE_VALUES)
    .withMessage(`module must be one of: ${MODULE_VALUES.join(", ")}`),
  body("description").optional({ checkFalsy: true }).trim().isLength({ max: 500 }),
];

export const listPermissionsValidationRules = [
  query("page").optional().isInt({ min: 1 }).withMessage("page must be a positive integer"),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("limit must be between 1 and 100"),
  query("search").optional().trim().isLength({ max: 100 }),
  query("isActive").optional().isIn(["true", "false"]),
  query("module").optional().isIn(MODULE_VALUES),
  query("sortBy").optional().isIn(["code", "name", "module", "createdAt", "updatedAt"]),
  query("sortOrder").optional().isIn(["asc", "desc"]),
];
