import jwt from "jsonwebtoken";
import { jwtConfig } from "../config/jwt.js";

/**
 * Low-level JWT sign/verify only. Payloads are intentionally minimal --
 * userId, username, sessionId, type -- never roles or permissions.
 * Authorization always re-queries the database (see authorize.js).
 */

export const signAccessToken = ({ userId, username, sessionId }) =>
  jwt.sign(
    { userId, username, sessionId, type: "access" },
    jwtConfig.accessSecret,
    {
      expiresIn: jwtConfig.accessExpiresIn,
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience,
    },
  );

export const signRefreshToken = ({ userId, username, sessionId }) =>
  jwt.sign(
    { userId, username, sessionId, type: "refresh" },
    jwtConfig.refreshSecret,
    {
      expiresIn: jwtConfig.refreshExpiresIn,
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience,
    },
  );

export const verifyAccessToken = (token) =>
  jwt.verify(token, jwtConfig.accessSecret, {
    issuer: jwtConfig.issuer,
    audience: jwtConfig.audience,
  });

export const verifyRefreshToken = (token) =>
  jwt.verify(token, jwtConfig.refreshSecret, {
    issuer: jwtConfig.issuer,
    audience: jwtConfig.audience,
  });

/**
 * Short-lived token proving OTP-verified phone ownership for a single
 * password reset. Carries the OTP row id so /reset-password can confirm
 * it's redeeming the exact OTP that was verified, not just any OTP the
 * user has ever had.
 */
export const signResetToken = ({ userId, otpId }) =>
  jwt.sign(
    { userId, otpId, type: "password_reset" },
    jwtConfig.resetTokenSecret,
    {
      expiresIn: jwtConfig.resetTokenExpiresIn,
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience,
    },
  );

export const verifyResetToken = (token) =>
  jwt.verify(token, jwtConfig.resetTokenSecret, {
    issuer: jwtConfig.issuer,
    audience: jwtConfig.audience,
  });
