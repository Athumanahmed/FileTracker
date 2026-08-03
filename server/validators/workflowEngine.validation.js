import { body, param } from "express-validator";

const ENGINE_ACTIONS = [
  "FORWARD",
  "RETURN",
  "REASSIGN",
  "HOLD",
  "RESUME",
  "APPROVE",
  "REJECT",
  "REQUEST_INFORMATION",
  "COMPLETE",
  "CLOSE",
];

export const fileIdParamValidationRules = [param("fileId").trim().notEmpty().withMessage("fileId is required")];

export const startWorkflowValidationRules = [
  ...fileIdParamValidationRules,
  body("templateId").trim().notEmpty().withMessage("templateId is required"),
  body("toUserId").optional({ checkFalsy: true }).trim(),
  body("remarks").optional({ checkFalsy: true }).trim().isLength({ max: 1000 }),
];

export const transitionWorkflowValidationRules = [
  ...fileIdParamValidationRules,
  body("action").trim().isIn(ENGINE_ACTIONS).withMessage(`action must be one of ${ENGINE_ACTIONS.join(", ")}`),
  body("toUserId").optional({ checkFalsy: true }).trim(),
  body("remarks").optional({ checkFalsy: true }).trim().isLength({ max: 1000 }),
];
