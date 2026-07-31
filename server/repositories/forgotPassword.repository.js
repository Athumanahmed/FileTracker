import prisma from "../config/prisma.js";
import { AUDIT_ACTIONS } from "../utils/auditActions.js";
import { applyPasswordChange } from "./password.repository.js";

/**
 * Data-access layer for the phone-OTP forgot-password flow. Every Prisma
 * call the flow makes lives here -- services never import the Prisma
 * client directly. All queries go through Prisma's parameterized query
 * builder; raw SQL is never used.
 */

export const findUserByPhoneNumber = (phoneNumber) =>
  prisma.user.findUnique({ where: { phoneNumber } });

/**
 * Enforces "only one active OTP per user": wipes any prior OTP row before
 * a new one is issued, whether that's a fresh /forgot-password request or
 * a /resend-reset-otp call.
 */
export const invalidatePreviousOtps = (userId) =>
  prisma.passwordResetOtp.deleteMany({ where: { userId } });

export const createOtp = (data) => prisma.passwordResetOtp.create({ data });

export const findLatestOtpByUserId = (userId) =>
  prisma.passwordResetOtp.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

export const incrementOtpAttempts = (id) =>
  prisma.passwordResetOtp.update({
    where: { id },
    data: { attempts: { increment: 1 } },
  });

export const markOtpVerified = (id) =>
  prisma.passwordResetOtp.update({
    where: { id },
    data: { verifiedAt: new Date() },
  });

/** Only matches an OTP that was verified and not yet redeemed by a reset. */
export const findVerifiedOtp = (id, userId) =>
  prisma.passwordResetOtp.findFirst({
    where: { id, userId, verifiedAt: { not: null }, usedAt: null },
  });

/**
 * Executes every side effect of a successful password reset atomically
 * (see applyPasswordChange), plus deleting the now-redeemed OTP row.
 */
export const executePasswordReset = ({ userId, passwordHash, otpId, ipAddress }) =>
  applyPasswordChange({
    userId,
    passwordHash,
    ipAddress,
    auditAction: AUDIT_ACTIONS.PASSWORD_RESET_SUCCESS,
    auditDescription: "Password reset completed via phone OTP verification",
    extraWrites: (tx) => tx.passwordResetOtp.delete({ where: { id: otpId } }),
  });
