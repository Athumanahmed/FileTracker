import crypto from "crypto";
import bcrypt from "bcryptjs";
import { securityConfig } from "../config/security.js";

// Exclusive upper bound -> uniformly distributed 6-digit codes "000000"-"999999".
const OTP_UPPER_BOUND = 1_000_000;

/**
 * Cryptographically secure 6-digit numeric OTP. crypto.randomInt() (not
 * Math.random()) is required here -- Math.random() is not a CSPRNG and its
 * output is predictable enough to brute-force in this context.
 */
export const generateOtp = () =>
  crypto.randomInt(0, OTP_UPPER_BOUND).toString().padStart(6, "0");

/** OTPs are stored as bcrypt hashes only -- the plaintext code is never persisted. */
export const hashOtp = (otp) => bcrypt.hash(otp, securityConfig.bcryptSaltRounds);

export const verifyOtpHash = (otp, otpHash) => bcrypt.compare(otp, otpHash);
