import { Router } from "express";

import * as fileMinuteController from "../controller/fileMinute.controller.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";
import { validateRequest } from "../middlewares/validation.js";
import { createMemoryUpload, wrapMulterErrors } from "../utils/multerUpload.js";
import { MAX_FILE_SIZE_BYTES } from "../storage/storage.constants.js";
import { replyMinuteValidationRules, minuteIdParamValidationRules } from "../validators/fileMinute.validation.js";

const router = Router();

const MAX_MINUTE_ATTACHMENTS = 5;
const upload = createMemoryUpload(MAX_FILE_SIZE_BYTES);
const handleAttachments = wrapMulterErrors(upload.array("attachments", MAX_MINUTE_ATTACHMENTS), {
  maxSizeBytes: MAX_FILE_SIZE_BYTES,
  fieldLabel: "attachments",
});

router.get("/:id", authenticate, authorize("MINUTES.READ"), minuteIdParamValidationRules, validateRequest, fileMinuteController.getMinute);

router.post(
  "/:id/reply",
  authenticate,
  authorize("MINUTES.CREATE"),
  handleAttachments,
  replyMinuteValidationRules,
  validateRequest,
  fileMinuteController.replyToMinute,
);

// Soft delete, author-or-admin only -- see fileMinute.service.js#deleteMinute.
router.delete(
  "/:id",
  authenticate,
  authorize("MINUTES.DELETE"),
  minuteIdParamValidationRules,
  validateRequest,
  fileMinuteController.deleteMinute,
);

export default router;
