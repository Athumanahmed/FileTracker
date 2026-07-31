import { body, query } from "express-validator";

const CODE_REGEX = /^[A-Z0-9_-]{2,20}$/;

const codeRule = (optional) => {
  let rule = body("code").trim();
  rule = optional ? rule.optional() : rule.notEmpty().withMessage("Code is required");

  return rule
    .customSanitizer((value) => (typeof value === "string" ? value.toUpperCase() : value))
    .matches(CODE_REGEX)
    .withMessage("Code must be 2-20 uppercase letters, numbers, hyphens, or underscores");
};

export const createUnitValidationRules = [
  body("departmentId").trim().notEmpty().withMessage("departmentId is required"),
  body("name").trim().notEmpty().withMessage("Name is required").isLength({ max: 150 }),
  codeRule(false),
  body("description").optional({ checkFalsy: true }).trim().isLength({ max: 500 }),
];

// departmentId is intentionally NOT accepted here -- immutable after
// creation (also enforced in the service as defense-in-depth).
export const updateUnitValidationRules = [
  body("name").optional().trim().notEmpty().withMessage("Name cannot be empty").isLength({ max: 150 }),
  codeRule(true),
  body("description").optional({ checkFalsy: true }).trim().isLength({ max: 500 }),
];

export const listUnitsValidationRules = [
  query("page").optional().isInt({ min: 1 }).withMessage("page must be a positive integer"),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("limit must be between 1 and 100"),
  query("search").optional().trim().isLength({ max: 100 }),
  query("isActive").optional().isIn(["true", "false"]),
  query("departmentId").optional().trim(),
  query("sortBy").optional().isIn(["name", "code", "createdAt", "updatedAt"]),
  query("sortOrder").optional().isIn(["asc", "desc"]),
];
