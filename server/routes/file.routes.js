import { Router } from "express";

import * as fileController from "../controller/file.controller.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";
import { validateRequest } from "../middlewares/validation.js";
import { createMemoryUpload, wrapMulterErrors } from "../utils/multerUpload.js";
import { MAX_FILE_SIZE_BYTES } from "../storage/storage.constants.js";
import { registerFileValidationRules, listFilesValidationRules } from "../validators/file.validation.js";
import fileAttachmentRoutes from "./fileAttachment.routes.js";
import workflowEngineRoutes from "./workflowEngine.routes.js";
import fileMovementRoutes from "./fileMovement.routes.js";
import fileMinuteRoutes from "./fileMinute.routes.js";
import timelineEventRoutes from "./timelineEvent.routes.js";
import fileArchiveRoutes from "./fileArchive.routes.js";

const router = Router();

const MAX_INITIAL_ATTACHMENTS = 10;

const upload = createMemoryUpload(MAX_FILE_SIZE_BYTES);
const handleAttachments = wrapMulterErrors(upload.array("attachments", MAX_INITIAL_ATTACHMENTS), {
  maxSizeBytes: MAX_FILE_SIZE_BYTES,
  fieldLabel: "attachments",
});

// Registry-Officer-only (SYSTEM_ADMIN retains its usual override) --
// enforced here via FILES.REGISTER, not re-checked in the service layer.
router.post(
  "/",
  authenticate,
  authorize("FILES.REGISTER"),
  handleAttachments,
  registerFileValidationRules,
  validateRequest,
  fileController.registerFile,
);

router.get("/", authenticate, authorize("FILES.READ"), listFilesValidationRules, validateRequest, fileController.listFiles);

router.get("/:id", authenticate, authorize("FILES.READ"), fileController.getFile);

router.use("/:fileId/attachments", fileAttachmentRoutes);
router.use("/:fileId/workflow", workflowEngineRoutes);
router.use("/:fileId/movements", fileMovementRoutes);
router.use("/:fileId/minutes", fileMinuteRoutes);
router.use("/:fileId/timeline", timelineEventRoutes);
router.use("/:fileId/archive", fileArchiveRoutes);

export default router;
