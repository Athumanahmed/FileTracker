import { Router } from "express";

import * as fileAttachmentController from "../controller/fileAttachment.controller.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";
import { validateRequest } from "../middlewares/validation.js";
import { createMemoryUpload, wrapMulterErrors } from "../utils/multerUpload.js";
import { MAX_FILE_SIZE_BYTES } from "../storage/storage.constants.js";
import { uploadAttachmentValidationRules, fileIdParamValidationRules } from "../validators/fileAttachment.validation.js";

// mergeParams -- mounted at /api/v1/files/:fileId/attachments, needs the
// parent router's :fileId.
const router = Router({ mergeParams: true });

const upload = createMemoryUpload(MAX_FILE_SIZE_BYTES);
const handleUpload = wrapMulterErrors(upload.single("file"), { maxSizeBytes: MAX_FILE_SIZE_BYTES, fieldLabel: "file" });

router.post(
  "/",
  authenticate,
  authorize("ATTACHMENTS.CREATE"),
  handleUpload,
  uploadAttachmentValidationRules,
  validateRequest,
  fileAttachmentController.uploadAttachment,
);

router.get(
  "/",
  authenticate,
  authorize("ATTACHMENTS.READ"),
  fileIdParamValidationRules,
  validateRequest,
  fileAttachmentController.listFileAttachments,
);

export default router;
