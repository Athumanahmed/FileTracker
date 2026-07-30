import { Router } from "express";
import * as authController from "../controller/auth.controller.js";
import { loginValidationRules } from "../validators/auth.validation.js";
import { validateRequest } from "../middlewares/validation.js";
import { loginLimiter, refreshLimiter } from "../middlewares/rateLimiter.js";
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

export default router;
