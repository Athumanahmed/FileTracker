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

// Readable by client JS on purpose -- see middlewares/csrf.js.
const csrfCookieOptions = {
  httpOnly: false,
  secure: isProduction,
  sameSite: "strict",
  path: AUTH_COOKIE_PATH,
  maxAge: REFRESH_MAX_AGE_MS,
};

const setAuthCookies = (res, refreshToken) => {
  const csrfToken = crypto.randomBytes(32).toString("hex");
  res.cookie(securityConfig.refreshTokenCookieName, refreshToken, refreshCookieOptions);
  res.cookie(securityConfig.csrfCookieName, csrfToken, csrfCookieOptions);
};

const clearAuthCookies = (res) => {
  res.clearCookie(securityConfig.refreshTokenCookieName, { path: AUTH_COOKIE_PATH });
  res.clearCookie(securityConfig.csrfCookieName, { path: AUTH_COOKIE_PATH });
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
  const { id: userId, sessionId } = req.user;

  await authService.logout({ sessionId, userId, ipAddress: req.ip });

  clearAuthCookies(res);

  res.status(200).json({ success: true, message: "Logged out successfully" });
});
