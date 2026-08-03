import { body, param, query } from "express-validator";

export const uploadObjectValidationRules = [
  body("context").optional().trim().isLength({ max: 50 }).withMessage("context must be at most 50 characters"),
];

export const objectIdParamValidationRules = [param("id").trim().notEmpty().withMessage("id is required")];

export const presignedUrlValidationRules = [
  ...objectIdParamValidationRules,
  query("expirySeconds")
    .optional()
    .isInt({ min: 60, max: 604800 })
    .withMessage("expirySeconds must be between 60 (1 minute) and 604800 (7 days)"),
];
