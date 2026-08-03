import { Router } from "express";
import * as archiveController from "../controller/archive.controller.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";
import { validateRequest } from "../middlewares/validation.js";
import { archiveFileValidationRules, restoreFileValidationRules, fileIdParamValidationRules } from "../validators/archive.validation.js";

// mergeParams -- mounted at /api/v1/files/:fileId/archive.
const router = Router({ mergeParams: true });

router.get("/", authenticate, authorize("ARCHIVE.READ"), fileIdParamValidationRules, validateRequest, archiveController.getArchiveStatus);

router.post("/", authenticate, authorize("ARCHIVE.MANAGE"), archiveFileValidationRules, validateRequest, archiveController.archiveFile);

router.post(
  "/restore",
  authenticate,
  authorize("ARCHIVE.MANAGE"),
  restoreFileValidationRules,
  validateRequest,
  archiveController.restoreFile,
);

export default router;
