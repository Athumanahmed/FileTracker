import { body, param } from "express-validator";

const MINUTE_TYPES = ["INSTRUCTION", "RECOMMENDATION", "APPROVAL", "REJECTION", "NOTE", "DECISION"];

export const fileIdParamValidationRules = [param("fileId").trim().notEmpty().withMessage("fileId is required")];

export const minuteIdParamValidationRules = [param("id").trim().notEmpty().withMessage("id is required")];

const minuteBodyRules = [
  body("content").trim().notEmpty().withMessage("content is required").isLength({ max: 5000 }),
  body("minuteType").optional().isIn(MINUTE_TYPES).withMessage(`minuteType must be one of ${MINUTE_TYPES.join(", ")}`),
  body("addressedToId").optional({ checkFalsy: true }).trim(),
];

export const writeMinuteValidationRules = [...fileIdParamValidationRules, ...minuteBodyRules];

export const replyMinuteValidationRules = [...minuteIdParamValidationRules, ...minuteBodyRules];
