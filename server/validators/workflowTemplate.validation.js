import { body, query, param } from "express-validator";

const WORKFLOW_ACTIONS = [
  "REGISTER",
  "FORWARD",
  "RETURN",
  "REASSIGN",
  "APPROVE",
  "REJECT",
  "REQUEST_INFORMATION",
  "HOLD",
  "RESUME",
  "COMPLETE",
  "ARCHIVE",
  "CLOSE",
];

const CODE_REGEX = /^[A-Z0-9_-]{2,30}$/;

const codeRule = (optional) => {
  let rule = body("code").trim();
  rule = optional ? rule.optional() : rule.notEmpty().withMessage("Code is required");
  return rule
    .customSanitizer((value) => (typeof value === "string" ? value.toUpperCase() : value))
    .matches(CODE_REGEX)
    .withMessage("Code must be 2-30 uppercase letters, numbers, hyphens, or underscores");
};

export const createTemplateValidationRules = [
  body("name").trim().notEmpty().withMessage("Name is required").isLength({ max: 150 }),
  codeRule(false),
  body("description").optional({ checkFalsy: true }).trim().isLength({ max: 500 }),
  body("categoryId").optional({ checkFalsy: true }).trim(),
  body("departmentId").optional({ checkFalsy: true }).trim(),
];

export const updateTemplateValidationRules = [
  body("name").optional().trim().notEmpty().withMessage("Name cannot be empty").isLength({ max: 150 }),
  body("description").optional({ checkFalsy: true }).trim().isLength({ max: 500 }),
  body("categoryId").optional({ checkFalsy: true }).trim(),
  body("departmentId").optional({ checkFalsy: true }).trim(),
];

export const listTemplatesValidationRules = [
  query("page").optional().isInt({ min: 1 }),
  query("limit").optional().isInt({ min: 1, max: 100 }),
  query("search").optional().trim().isLength({ max: 100 }),
  query("isActive").optional().isIn(["true", "false"]),
  query("departmentId").optional().trim(),
  query("categoryId").optional().trim(),
  query("sortBy").optional().isIn(["name", "code", "createdAt", "updatedAt"]),
  query("sortOrder").optional().isIn(["asc", "desc"]),
];

export const templateIdParamValidationRules = [param("id").trim().notEmpty()];

const allowedActionsRule = body("allowedActions")
  .optional()
  .isArray()
  .withMessage("allowedActions must be an array")
  .custom((value) => value.every((action) => WORKFLOW_ACTIONS.includes(action)))
  .withMessage(`allowedActions may only contain: ${WORKFLOW_ACTIONS.join(", ")}`);

export const createStepValidationRules = [
  param("id").trim().notEmpty(),
  body("stepOrder").isInt({ min: 1 }).withMessage("stepOrder must be a positive integer"),
  body("name").trim().notEmpty().withMessage("Name is required").isLength({ max: 150 }),
  body("description").optional({ checkFalsy: true }).trim().isLength({ max: 500 }),
  body("requiredPositionId").optional({ checkFalsy: true }).trim(),
  body("requiredRoleId").optional({ checkFalsy: true }).trim(),
  body("slaHours").optional({ checkFalsy: true }).isInt({ min: 1 }).withMessage("slaHours must be a positive integer"),
  body("isFinalStep").optional().isBoolean(),
  allowedActionsRule,
];

export const updateStepValidationRules = [
  param("id").trim().notEmpty(),
  param("stepId").trim().notEmpty(),
  body("name").optional().trim().notEmpty().isLength({ max: 150 }),
  body("description").optional({ checkFalsy: true }).trim().isLength({ max: 500 }),
  body("requiredPositionId").optional({ checkFalsy: true }).trim(),
  body("requiredRoleId").optional({ checkFalsy: true }).trim(),
  body("slaHours").optional({ checkFalsy: true }).isInt({ min: 1 }),
  body("isFinalStep").optional().isBoolean(),
  allowedActionsRule,
];

export const stepIdParamValidationRules = [param("id").trim().notEmpty(), param("stepId").trim().notEmpty()];
