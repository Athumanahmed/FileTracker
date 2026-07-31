import { Router } from "express";
import * as authController from "../controller/auth.controller.js";
import {
  loginValidationRules,
  forceChangePasswordValidationRules,
} from "../validators/auth.validation.js";
import { validateRequest } from "../middlewares/validation.js";
import {
  loginLimiter,
  refreshLimiter,
  forceChangePasswordLimiter,
} from "../middlewares/rateLimiter.js";
import { verifyCsrfToken } from "../middlewares/csrf.js";
import { authenticate } from "../middlewares/authenticate.js";

const router = Router();

router.post(
  "/login",
  loginLimiter,
  loginValidationRules,
  validateRequest,
  authController.login,
);

// Cookie-authenticated (no Bearer token yet) -- requires the CSRF double-submit check.
router.post("/refresh", refreshLimiter, verifyCsrfToken, authController.refresh);

// Bearer-authenticated, so it identifies + revokes the correct session.
router.post("/logout", authenticate, authController.logout);

// Identity comes only from the validated access token -- no :userId param.
router.get("/me", authenticate, authController.getCurrentUser);

// Only reachable route (besides /logout) while mustChangePassword is true --
// enforced centrally in `authenticate`, not here.
router.post(
  "/force-change-password",
  authenticate,
  forceChangePasswordLimiter,
  forceChangePasswordValidationRules,
  validateRequest,
  authController.forceChangePassword,
);

// Same handler as /force-change-password -- it already works for any
// authenticated user, not just ones mid-mandatory-change. This is just the
// discoverable name for the voluntary "change my password" case.
router.post(
  "/change-password",
  authenticate,
  forceChangePasswordLimiter,
  forceChangePasswordValidationRules,
  validateRequest,
  authController.forceChangePassword,
);

router.get("/sessions", authenticate, authController.listSessions);

router.delete("/sessions/:sessionId", authenticate, authController.revokeSession);

// Kills every session (including this one) -- the client should treat this
// exactly like /logout and clear its own tokens too.
router.post("/logout-all", authenticate, authController.logoutAll);

export default router;
