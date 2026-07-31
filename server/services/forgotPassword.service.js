import { AppError } from "../utils/AppError.js";
import { AUDIT_ACTIONS } from "../utils/auditActions.js";
import { securityConfig } from "../config/security.js";
import { normalizePhoneNumber } from "./phone.service.js";
import { generateOtp, hashOtp, verifyOtpHash } from "./otp.service.js";
import { beemSmsService } from "./beem.service.js";
import { hashPassword } from "./password.service.js";
import { signResetToken, verifyResetToken } from "./jwt.service.js";
import * as authRepository from "../repositories/auth.repository.js";
import * as forgotPasswordRepository from "../repositories/forgotPassword.repository.js";

// Identical wording for every branch of /forgot-password and /resend-reset-otp
// (phone registered or not, SMS delivery succeeded or failed) so neither
// endpoint can be used as an oracle for which phone numbers are registered.
const GENERIC_OTP_RESPONSE_MESSAGE = "If the phone number is registered, an OTP has been sent.";

// Also identical across every /verify-reset-otp failure reason (no such
// user, no OTP, expired, already used, max attempts, wrong code) for the
// same reason -- the reason itself must never leak to the caller.
const GENERIC_OTP_INVALID_MESSAGE = "Invalid or expired OTP. Please request a new one.";

const RESET_TOKEN_ERROR = "Invalid or expired reset token. Please verify your OTP again.";

const isEligibleForReset = (user) => Boolean(user && !user.deletedAt && user.isActive);

/**
 * Shared by requestPasswordReset and resendResetOtp: normalize the phone,
 * and -- only if a matching, active user exists -- invalidate any previous
 * OTP and issue + send a fresh one. Every code path (bad phone format
 * aside, which fails validation before this ever runs) returns the same
 * generic outcome to the caller, including SMS delivery failures.
 */
const issueOtp = async ({ phoneNumber, ipAddress }) => {
  const normalizedPhone = normalizePhoneNumber(phoneNumber);
  const user = await forgotPasswordRepository.findUserByPhoneNumber(normalizedPhone);

  if (!isEligibleForReset(user)) {
    return;
  }

  const otp = generateOtp();
  const otpHash = await hashOtp(otp);

  await forgotPasswordRepository.invalidatePreviousOtps(user.id);
  await forgotPasswordRepository.createOtp({
    userId: user.id,
    phoneNumber: normalizedPhone,
    otpHash,
    expiresAt: new Date(Date.now() + securityConfig.otpExpiryMs),
  });

  try {
    await beemSmsService.sendOtp(normalizedPhone, otp);
  } catch (err) {
    // Delivery failure must never change the response the caller sees --
    // that would turn this endpoint into a phone-number oracle. The OTP
    // row still exists, so the user can retry via /resend-reset-otp.
    // Never log `otp` or the SMS body here, only that a send failed.
    console.error("[forgotPassword] Beem SMS delivery failed", {
      userId: user.id,
      reason: err.message,
    });
  }

  await authRepository.createAuditLog({
    userId: user.id,
    action: AUDIT_ACTIONS.PASSWORD_RESET_REQUESTED,
    entity: "User",
    entityId: user.id,
    description: "Password reset OTP requested",
    ipAddress,
  });
};

export const requestPasswordReset = async ({ phoneNumber, ipAddress }) => {
  await issueOtp({ phoneNumber, ipAddress });
  return { message: GENERIC_OTP_RESPONSE_MESSAGE };
};

export const resendResetOtp = async ({ phoneNumber, ipAddress }) => {
  await issueOtp({ phoneNumber, ipAddress });
  return { message: GENERIC_OTP_RESPONSE_MESSAGE };
};

export const verifyResetOtp = async ({ phoneNumber, otp, ipAddress }) => {
  const normalizedPhone = normalizePhoneNumber(phoneNumber);
  const user = await forgotPasswordRepository.findUserByPhoneNumber(normalizedPhone);

  if (!isEligibleForReset(user)) {
    throw new AppError(400, GENERIC_OTP_INVALID_MESSAGE);
  }

  const record = await forgotPasswordRepository.findLatestOtpByUserId(user.id);

  // No OTP on file, or it was already verified/redeemed by a prior call.
  if (!record || record.verifiedAt || record.usedAt) {
    throw new AppError(400, GENERIC_OTP_INVALID_MESSAGE);
  }

  if (record.expiresAt < new Date()) {
    throw new AppError(400, GENERIC_OTP_INVALID_MESSAGE);
  }

  // Locked out after 5 wrong attempts -- reject without even comparing the
  // hash, so a 6th guess can't succeed even if it happens to be correct.
  if (record.attempts >= securityConfig.otpMaxAttempts) {
    throw new AppError(400, GENERIC_OTP_INVALID_MESSAGE);
  }

  const isMatch = await verifyOtpHash(otp, record.otpHash);

  if (!isMatch) {
    await forgotPasswordRepository.incrementOtpAttempts(record.id);
    throw new AppError(400, GENERIC_OTP_INVALID_MESSAGE);
  }

  await forgotPasswordRepository.markOtpVerified(record.id);

  const resetToken = signResetToken({ userId: user.id, otpId: record.id });

  await authRepository.createAuditLog({
    userId: user.id,
    action: AUDIT_ACTIONS.PASSWORD_RESET_OTP_VERIFIED,
    entity: "User",
    entityId: user.id,
    description: "Password reset OTP verified",
    ipAddress,
  });

  return { resetToken };
};

/**
 * Identity for this step comes solely from the validated reset token (see
 * controller) -- never from a request param or body.
 */
export const resetPassword = async ({ resetToken, newPassword, ipAddress }) => {
  if (!resetToken) {
    throw new AppError(401, "Reset token is required");
  }

  let decoded;
  try {
    decoded = verifyResetToken(resetToken);
  } catch {
    throw new AppError(401, RESET_TOKEN_ERROR);
  }

  if (decoded.type !== "password_reset") {
    throw new AppError(401, RESET_TOKEN_ERROR);
  }

  // Re-validates against DB state -- a signature check alone can't see
  // that the OTP it points to was already redeemed since the token was issued.
  const otpRecord = await forgotPasswordRepository.findVerifiedOtp(decoded.otpId, decoded.userId);
  if (!otpRecord) {
    throw new AppError(401, RESET_TOKEN_ERROR);
  }

  const user = await authRepository.findUserById(decoded.userId);
  if (!isEligibleForReset(user)) {
    throw new AppError(401, RESET_TOKEN_ERROR);
  }

  const passwordHash = await hashPassword(newPassword);

  await forgotPasswordRepository.executePasswordReset({
    userId: user.id,
    passwordHash,
    otpId: otpRecord.id,
    ipAddress,
  });
};
