import { Router } from "express";

import * as fileMinuteController from "../controller/fileMinute.controller.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";
import { validateRequest } from "../middlewares/validation.js";
import { createMemoryUpload, wrapMulterErrors } from "../utils/multerUpload.js";
import { MAX_FILE_SIZE_BYTES } from "../storage/storage.constants.js";
import { writeMinuteValidationRules, fileIdParamValidationRules } from "../validators/fileMinute.validation.js";

// mergeParams -- mounted at /api/v1/files/:fileId/minutes.
const router = Router({ mergeParams: true });

const MAX_MINUTE_ATTACHMENTS = 5;
const upload = createMemoryUpload(MAX_FILE_SIZE_BYTES);
const handleAttachments = wrapMulterErrors(upload.array("attachments", MAX_MINUTE_ATTACHMENTS), {
  maxSizeBytes: MAX_FILE_SIZE_BYTES,
  fieldLabel: "attachments",
});

router.post(
  "/",
  authenticate,
  authorize("MINUTES.CREATE"),
  handleAttachments,
  writeMinuteValidationRules,
  validateRequest,
  fileMinuteController.writeMinute,
);

router.get(
  "/",
  authenticate,
  authorize("MINUTES.READ"),
  fileIdParamValidationRules,
  validateRequest,
  fileMinuteController.listFileMinutes,
);

export default router;
