import { Router } from "express";

import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";
import { validateRequest } from "../middlewares/validation.js";
import { createMemoryUpload, wrapMulterErrors } from "../utils/multerUpload.js";
import * as storageController from "./storage.controller.js";
import { MAX_FILE_SIZE_BYTES } from "./storage.constants.js";
import {
  uploadObjectValidationRules,
  objectIdParamValidationRules,
  presignedUrlValidationRules,
} from "./storage.validation.js";

const router = Router();

const upload = createMemoryUpload(MAX_FILE_SIZE_BYTES);
const handleUpload = wrapMulterErrors(upload.single("file"), { maxSizeBytes: MAX_FILE_SIZE_BYTES, fieldLabel: "file" });

// Unauthenticated on purpose -- an infrastructure liveness/readiness probe,
// mirrors the top-level /api/v1/health endpoint in server.js.
router.get("/health", storageController.getStorageHealth);

router.post(
  "/",
  authenticate,
  authorize("STORAGE.UPLOAD"),
  handleUpload,
  uploadObjectValidationRules,
  validateRequest,
  storageController.uploadObject,
);

router.get(
  "/:id",
  authenticate,
  authorize("STORAGE.READ"),
  objectIdParamValidationRules,
  validateRequest,
  storageController.getObjectMetadata,
);

router.get(
  "/:id/download",
  authenticate,
  authorize("STORAGE.DOWNLOAD"),
  objectIdParamValidationRules,
  validateRequest,
  storageController.downloadObject,
);

router.get(
  "/:id/presigned-url",
  authenticate,
  authorize("STORAGE.DOWNLOAD"),
  presignedUrlValidationRules,
  validateRequest,
  storageController.getPresignedUrl,
);

// Hard delete at the provider, soft delete on the metadata row -- see
// storage.service.js#deleteObject for why that order was chosen.
router.delete(
  "/:id",
  authenticate,
  authorize("STORAGE.DELETE"),
  objectIdParamValidationRules,
  validateRequest,
  storageController.deleteObject,
);

export default router;
