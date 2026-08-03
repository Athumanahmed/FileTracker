import { Router } from "express";

import * as fileAttachmentController from "../controller/fileAttachment.controller.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";
import { validateRequest } from "../middlewares/validation.js";
import { createMemoryUpload, wrapMulterErrors } from "../utils/multerUpload.js";
import { MAX_FILE_SIZE_BYTES } from "../storage/storage.constants.js";
import {
  attachmentIdParamValidationRules,
  versionDownloadParamValidationRules,
} from "../validators/fileAttachment.validation.js";

const router = Router();

const upload = createMemoryUpload(MAX_FILE_SIZE_BYTES);
const handleUpload = wrapMulterErrors(upload.single("file"), { maxSizeBytes: MAX_FILE_SIZE_BYTES, fieldLabel: "file" });

router.get(
  "/:id",
  authenticate,
  authorize("ATTACHMENTS.READ"),
  attachmentIdParamValidationRules,
  validateRequest,
  fileAttachmentController.getAttachment,
);

router.get(
  "/:id/versions",
  authenticate,
  authorize("ATTACHMENTS.READ"),
  attachmentIdParamValidationRules,
  validateRequest,
  fileAttachmentController.listVersions,
);

router.get(
  "/:id/download",
  authenticate,
  authorize("ATTACHMENTS.DOWNLOAD"),
  attachmentIdParamValidationRules,
  validateRequest,
  fileAttachmentController.downloadAttachment,
);

router.get(
  "/:id/versions/:versionId/download",
  authenticate,
  authorize("ATTACHMENTS.DOWNLOAD"),
  versionDownloadParamValidationRules,
  validateRequest,
  fileAttachmentController.downloadAttachment,
);

router.get(
  "/:id/preview",
  authenticate,
  authorize("ATTACHMENTS.DOWNLOAD"),
  attachmentIdParamValidationRules,
  validateRequest,
  fileAttachmentController.previewAttachment,
);

router.post(
  "/:id/replace",
  authenticate,
  authorize("ATTACHMENTS.UPDATE"),
  handleUpload,
  attachmentIdParamValidationRules,
  validateRequest,
  fileAttachmentController.replaceAttachment,
);

// Soft delete only -- see fileAttachment.service.js#deleteAttachment.
router.delete(
  "/:id",
  authenticate,
  authorize("ATTACHMENTS.DELETE"),
  attachmentIdParamValidationRules,
  validateRequest,
  fileAttachmentController.deleteAttachment,
);

export default router;
