import * as authRepository from "../repositories/auth.repository.js";
import { parseUserAgent } from "../utils/parseUserAgent.js";
import * as refreshTokenService from "./refreshToken.service.js";

export const createSession = async ({ userId, ipAddress, userAgent, ttlMs }) => {
  const { deviceName, browser, operatingSystem } = parseUserAgent(userAgent);

  return authRepository.createSession({
    userId,
    ipAddress,
    userAgent,
    deviceName,
    browser,
    operatingSystem,
    isActive: true,
    lastActivityAt: new Date(),
    expiresAt: new Date(Date.now() + ttlMs),
  });
};

export const getActiveSession = (sessionId) =>
  authRepository.findActiveSessionById(sessionId);

export const touchSession = (sessionId) =>
  authRepository.touchSessionActivity(sessionId);

/**
 * Fully ends a session: deactivates it and revokes every refresh token
 * issued under it, so a stolen-but-unused refresh token can't outlive
 * the logout.
 */
export const endSession = async (sessionId) => {
  await refreshTokenService.revokeAllForSession(sessionId);
  await authRepository.deactivateSession(sessionId);
};
