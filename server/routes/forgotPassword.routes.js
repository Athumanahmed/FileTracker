import { Router } from "express";
import * as forgotPasswordController from "../controller/forgotPassword.controller.js";
import {
  forgotPasswordValidationRules,
  verifyResetOtpValidationRules,
  resendResetOtpValidationRules,
  resetPasswordValidationRules,
} from "../validators/forgotPassword.validation.js";
import { validateRequest } from "../middlewares/validation.js";
import {
  forgotPasswordLimiter,
  verifyResetOtpLimiter,
  resendResetOtpLimiter,
  resetPasswordLimiter,
} from "../middlewares/rateLimiter.js";

const router = Router();

router.post(
  "/forgot-password",
  forgotPasswordLimiter,
  forgotPasswordValidationRules,
  validateRequest,
  forgotPasswordController.forgotPassword,
);

router.post(
  "/verify-reset-otp",
  verifyResetOtpLimiter,
  verifyResetOtpValidationRules,
  validateRequest,
  forgotPasswordController.verifyResetOtp,
);

router.post(
  "/resend-reset-otp",
  resendResetOtpLimiter,
  resendResetOtpValidationRules,
  validateRequest,
  forgotPasswordController.resendResetOtp,
);

// Bearer-authenticated with the short-lived reset token from /verify-reset-otp
// (not the normal access token) -- validated inside the service.
router.post(
  "/reset-password",
  resetPasswordLimiter,
  resetPasswordValidationRules,
  validateRequest,
  forgotPasswordController.resetPassword,
);

export default router;
