import { Router } from "express";
import * as citizenController from "../controller/citizen.controller.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";
import { validateRequest } from "../middlewares/validation.js";
import { setSmsPreferenceValidationRules } from "../validators/citizen.validation.js";

const router = Router();

// Registry owns citizen intake, so it owns the citizen-facing SMS opt-out too.
router.patch(
  "/:id/sms-preference",
  authenticate,
  authorize("FILES.REGISTER"),
  setSmsPreferenceValidationRules,
  validateRequest,
  citizenController.setSmsPreference,
);

export default router;
