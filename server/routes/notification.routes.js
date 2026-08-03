import { Router } from "express";
import * as notificationController from "../controller/notification.controller.js";
import { authenticate } from "../middlewares/authenticate.js";
import { validateRequest } from "../middlewares/validation.js";
import {
  listNotificationsValidationRules,
  notificationIdParamValidationRules,
  setPreferenceValidationRules,
} from "../validators/notification.validation.js";

const router = Router();

// All self-scoped (identity from the access token, never a :userId param) --
// no `authorize` permission gate, matching /auth/me and /auth/sessions:
// every authenticated user manages their own notifications and nobody else's.

router.get("/", authenticate, listNotificationsValidationRules, validateRequest, notificationController.listMyNotifications);

router.patch("/read-all", authenticate, notificationController.markAllNotificationsRead);

router.patch(
  "/:id/read",
  authenticate,
  notificationIdParamValidationRules,
  validateRequest,
  notificationController.markNotificationRead,
);

router.get("/preferences", authenticate, notificationController.listMyPreferences);

router.put("/preferences", authenticate, setPreferenceValidationRules, validateRequest, notificationController.setMyPreference);

export default router;
