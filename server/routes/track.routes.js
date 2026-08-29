import { Router } from "express";
import * as trackController from "../controller/track.controller.js";
import { validateRequest } from "../middlewares/validation.js";
import { trackFileLimiter } from "../middlewares/rateLimiter.js";
import { trackFileValidationRules } from "../validators/track.validation.js";

const router = Router();

// Public -- no `authenticate`. A citizen looks up their file with the
// tracking number from their SMS plus the phone number it was sent to.
router.get("/", trackFileLimiter, trackFileValidationRules, validateRequest, trackController.trackFile);

export default router;
