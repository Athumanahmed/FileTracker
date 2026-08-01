import { body, query } from "express-validator";

const CODE_REGEX = /^[A-Z0-9_-]{2,20}$/;
const POSITION_TYPES = ["EXECUTIVE", "MANAGEMENT", "SUPERVISORY", "OPERATIONAL", "SUPPORT"];

const codeRule = (optional) => {
  let rule = body("code").trim();
  rule = optional ? rule.optional() : rule.notEmpty().withMessage("Code is required");

  return rule
    .customSanitizer((value) => (typeof value === "string" ? value.toUpperCase() : value))
    .matches(CODE_REGEX)
    .withMessage("Code must be 2-20 uppercase letters, numbers, hyphens, or underscores");
};

// unitId is intentionally NOT accepted on update -- immutable after
// creation (also enforced in the service as defense-in-depth).
export const createPositionValidationRules = [
  body("unitId").trim().notEmpty().withMessage("unitId is required"),
  body("title").trim().notEmpty().withMessage("Title is required").isLength({ max: 150 }),
  codeRule(false),
  body("description").optional({ checkFalsy: true }).trim().isLength({ max: 500 }),
  body("rank")
    .notEmpty()
    .withMessage("Rank is required")
    .isInt({ min: 1, max: 100 })
    .withMessage("Rank must be an integer between 1 and 100")
    .toInt(),
  body("positionType")
    .trim()
    .notEmpty()
    .withMessage("positionType is required")
    .isIn(POSITION_TYPES)
    .withMessage(`positionType must be one of: ${POSITION_TYPES.join(", ")}`),
  body("isHead").optional().isBoolean().withMessage("isHead must be a boolean").toBoolean(),
];

export const updatePositionValidationRules = [
  body("title").optional().trim().notEmpty().withMessage("Title cannot be empty").isLength({ max: 150 }),
  codeRule(true),
  body("description").optional({ checkFalsy: true }).trim().isLength({ max: 500 }),
  body("rank")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Rank must be an integer between 1 and 100")
    .toInt(),
  body("positionType")
    .optional()
    .trim()
    .isIn(POSITION_TYPES)
    .withMessage(`positionType must be one of: ${POSITION_TYPES.join(", ")}`),
  body("isHead").optional().isBoolean().withMessage("isHead must be a boolean").toBoolean(),
];

export const listPositionsValidationRules = [
  query("page").optional().isInt({ min: 1 }).withMessage("page must be a positive integer"),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("limit must be between 1 and 100"),
  query("search").optional().trim().isLength({ max: 100 }),
  query("isActive").optional().isIn(["true", "false"]),
  query("unitId").optional().trim(),
  query("departmentId").optional().trim(),
  query("positionType").optional().isIn(POSITION_TYPES),
  query("sortBy").optional().isIn(["title", "code", "rank", "positionType", "createdAt", "updatedAt"]),
  query("sortOrder").optional().isIn(["asc", "desc"]),
];
