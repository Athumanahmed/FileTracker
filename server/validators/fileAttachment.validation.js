import { body, param } from "express-validator";

const ATTACHMENT_TYPES = ["DOCUMENT", "IMAGE", "SCAN", "LETTER", "MEMO", "REPORT", "CONTRACT", "INVOICE", "OTHER"];

export const fileIdParamValidationRules = [param("fileId").trim().notEmpty().withMessage("fileId is required")];

export const uploadAttachmentValidationRules = [
  ...fileIdParamValidationRules,
  body("title").optional({ checkFalsy: true }).trim().isLength({ max: 255 }),
  body("attachmentType").optional().isIn(ATTACHMENT_TYPES).withMessage(`attachmentType must be one of ${ATTACHMENT_TYPES.join(", ")}`),
];

export const attachmentIdParamValidationRules = [param("id").trim().notEmpty().withMessage("id is required")];

export const versionDownloadParamValidationRules = [
  ...attachmentIdParamValidationRules,
  param("versionId").trim().notEmpty().withMessage("versionId is required"),
];
