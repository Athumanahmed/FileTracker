import crypto from "crypto";
import * as authRepository from "../repositories/auth.repository.js";
import { AppError } from "../utils/AppError.js";
import { parseDurationToMs } from "../utils/duration.js";
import { jwtConfig } from "../config/jwt.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "./jwt.service.js";

/**
 * Refresh tokens are signed JWTs (so a tampered/expired token is rejected
 * by signature verification before ever touching the database), but the
 * database is what actually makes them revocable. We store SHA-256(token)
 * -- not bcrypt -- because a refresh token is already a high-entropy random
 * secret (not a low-entropy password), so a slow salted hash buys nothing
 * and a deterministic hash is what lets us look the row up by tokenHash.
 */
const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

/**
 * Signs a new refresh token for a session and persists its hash.
 * Returns the raw token -- only the hash is ever stored.
 */
export const issueRefreshToken = async ({ userId, username, sessionId }) => {
  const token = signRefreshToken({ userId, username, sessionId });
  const tokenHash = hashToken(token);
  const expiresAt = new Date(
    Date.now() + parseDurationToMs(jwtConfig.refreshExpiresIn),
  );

  await authRepository.createRefreshToken({
    userId,
    sessionId,
    tokenHash,
    expiresAt,
  });

  return token;
};

export const revokeRefreshTokenByRaw = async (rawToken) => {
  const stored = await authRepository.findActiveRefreshTokenByHash(
    hashToken(rawToken),
  );
  if (stored) {
    await authRepository.revokeRefreshToken(stored.id);
  }
};

export const revokeAllForSession = (sessionId) =>
  authRepository.revokeAllSessionRefreshTokens(sessionId);

/**
 * Refresh Token Rotation: verify -> validate against DB state -> revoke the
 * presented token -> issue a brand new access/refresh pair on the same
 * session. Any failure at any step invalidates the whole attempt.
 */
export const rotateRefreshToken = async (rawToken) => {
  let decoded;
  try {
    decoded = verifyRefreshToken(rawToken);
  } catch {
    throw new AppError(401, "Invalid or expired refresh token");
  }

  if (decoded.type !== "refresh") {
    throw new AppError(401, "Invalid token type");
  }

  const stored = await authRepository.findActiveRefreshTokenByHash(
    hashToken(rawToken),
  );

  if (
    !stored ||
    stored.userId !== decoded.userId ||
    stored.sessionId !== decoded.sessionId
  ) {
    throw new AppError(401, "Refresh token has been revoked or is invalid");
  }

  const session = stored.session;
  if (!session || !session.isActive || session.expiresAt < new Date()) {
    throw new AppError(401, "Session has expired. Please log in again.");
  }

  const user = await authRepository.findUserById(decoded.userId);
  if (!user || !user.isActive || user.status !== "ACTIVE") {
    throw new AppError(401, "Account is no longer active");
  }

  // Rotate: the presented token is single-use from this point forward.
  await authRepository.revokeRefreshToken(stored.id);

  const newRefreshToken = await issueRefreshToken({
    userId: user.id,
    username: user.username,
    sessionId: session.id,
  });
  const newAccessToken = signAccessToken({
    userId: user.id,
    username: user.username,
    sessionId: session.id,
  });

  await authRepository.touchSessionActivity(session.id);

  return { accessToken: newAccessToken, refreshToken: newRefreshToken, user };
};
