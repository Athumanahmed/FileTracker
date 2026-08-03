import { body, param } from "express-validator";

export const fileIdParamValidationRules = [param("fileId").trim().notEmpty().withMessage("fileId is required")];

export const archiveFileValidationRules = [
  ...fileIdParamValidationRules,
  body("retentionYears").optional({ checkFalsy: true }).isInt({ min: 1, max: 100 }).withMessage("retentionYears must be between 1 and 100"),
  body("storageLocation").optional({ checkFalsy: true }).trim().isLength({ max: 200 }),
  body("remarks").optional({ checkFalsy: true }).trim().isLength({ max: 1000 }),
];

export const restoreFileValidationRules = [
  ...fileIdParamValidationRules,
  body("remarks").optional({ checkFalsy: true }).trim().isLength({ max: 1000 }),
];
