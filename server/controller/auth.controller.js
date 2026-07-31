import crypto from "crypto";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as authService from "../services/auth.service.js";
import { jwtConfig } from "../config/jwt.js";
import { securityConfig } from "../config/security.js";
import { parseDurationToMs } from "../utils/duration.js";

const isProduction = process.env.NODE_ENV === "production";
const AUTH_COOKIE_PATH = "/api/v1/auth";
const REFRESH_MAX_AGE_MS = parseDurationToMs(jwtConfig.refreshExpiresIn);

const refreshCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "strict",
  path: AUTH_COOKIE_PATH,
  maxAge: REFRESH_MAX_AGE_MS,
};

// Readable by client JS on purpose -- see middlewares/csrf.js. Path is
// site-wide ("/"), unlike the refresh cookie's narrower AUTH_COOKIE_PATH:
// a cookie's path also gates which pages document.cookie can see it from,
// not just which requests it's attached to -- the frontend SPA lives on
// routes like "/" and "/login", not under /api/v1/auth, so scoping this
// to AUTH_COOKIE_PATH would make it invisible to the JS that needs to
// read it and echo it back as a header.
const csrfCookieOptions = {
  httpOnly: false,
  secure: isProduction,
  sameSite: "strict",
  path: "/",
  maxAge: REFRESH_MAX_AGE_MS,
};

const setAuthCookies = (res, refreshToken) => {
  const csrfToken = crypto.randomBytes(32).toString("hex");
  res.cookie(securityConfig.refreshTokenCookieName, refreshToken, refreshCookieOptions);
  res.cookie(securityConfig.csrfCookieName, csrfToken, csrfCookieOptions);
};

const clearAuthCookies = (res) => {
  // path must match how each cookie was originally set (see setAuthCookies)
  // -- clearCookie only works if name+path+domain line up exactly.
  res.clearCookie(securityConfig.refreshTokenCookieName, { path: AUTH_COOKIE_PATH });
  res.clearCookie(securityConfig.csrfCookieName, { path: "/" });
};

export const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  const { accessToken, refreshToken, user } = await authService.login({
    username,
    password,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
  });

  setAuthCookies(res, refreshToken);

  res.status(200).json({
    success: true,
    message: "Login successful",
    data: { accessToken, user },
  });
});

export const refresh = asyncHandler(async (req, res) => {
  const rawRefreshToken = req.cookies?.[securityConfig.refreshTokenCookieName];

  const { accessToken, refreshToken, user } = await authService.refreshAccessToken(
    rawRefreshToken,
    { ipAddress: req.ip },
  );

  setAuthCookies(res, refreshToken);

  res.status(200).json({
    success: true,
    message: "Token refreshed",
    data: { accessToken, user },
  });
});

export const logout = asyncHandler(async (req, res) => {
  const { userId, sessionId } = req.user;

  await authService.logout({ sessionId, userId, ipAddress: req.ip });

  clearAuthCookies(res);

  res.status(200).json({ success: true, message: "Logged out successfully" });
});

export const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await authService.getCurrentUser(req.user.userId);

  res.status(200).json({
    success: true,
    message: "User profile retrieved successfully.",
    data: user,
  });
});

export const forceChangePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  await authService.forceChangePassword({
    userId: req.user.userId,
    currentPassword,
    newPassword,
    ipAddress: req.ip,
  });

  // Deliberately no new tokens -- the frontend clears everything and
  // sends the user back through a normal login with the new password.
  res.status(200).json({
    success: true,
    message: "Password updated successfully. Please sign in again.",
  });
});

export const listSessions = asyncHandler(async (req, res) => {
  const { userId, sessionId } = req.user;

  const sessions = await authService.listSessions({ userId, currentSessionId: sessionId });

  res.status(200).json({
    success: true,
    message: "Active sessions retrieved successfully.",
    data: sessions,
  });
});

export const revokeSession = asyncHandler(async (req, res) => {
  const { userId } = req.user;
  const { sessionId } = req.params;

  await authService.revokeSession({ userId, sessionId, ipAddress: req.ip });

  res.status(200).json({ success: true, message: "Session revoked successfully." });
});

export const logoutAll = asyncHandler(async (req, res) => {
  const { userId } = req.user;

  await authService.logoutAll({ userId, ipAddress: req.ip });

  clearAuthCookies(res);

  res.status(200).json({ success: true, message: "Logged out of all devices successfully." });
});
