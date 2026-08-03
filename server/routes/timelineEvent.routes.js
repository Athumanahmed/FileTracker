import { Router } from "express";
import * as timelineEventController from "../controller/timelineEvent.controller.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";
import { validateRequest } from "../middlewares/validation.js";
import { listTimelineValidationRules } from "../validators/timelineEvent.validation.js";

// mergeParams -- mounted at /api/v1/files/:fileId/timeline. Read-only: GET only, no write routes exist here by design.
const router = Router({ mergeParams: true });

router.get("/", authenticate, authorize("TIMELINE.READ"), listTimelineValidationRules, validateRequest, timelineEventController.listTimeline);

export default router;
