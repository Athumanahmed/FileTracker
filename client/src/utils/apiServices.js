import apiClient from "./apiClient";

/**
 * Single source of truth for every backend endpoint this frontend calls.
 * Components/hooks/store actions import these functions and never call
 * apiClient directly or hardcode a URL -- if a route ever moves, this file
 * is the only place that changes.
 *
 * Every function returns the raw axios response (not pre-unwrapped) --
 * callers destructure `.data` themselves, consistently across the app.
 */

// Must match server/config/security.js's CSRF_COOKIE_NAME.
const CSRF_COOKIE_NAME = "eftms_csrf_token";

const getCookie = (name) => {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
};

const authHeader = (accessToken) => ({
  headers: { Authorization: `Bearer ${accessToken}` },
});

// -- Auth -----------------------------------------------------------------

export const loginUser = ({ username, password }) =>
  apiClient.post("/api/v1/auth/login", { username, password });

/**
 * Relies on the httpOnly refresh-token cookie the backend set at login --
 * there's nothing to pass in except the CSRF token, which (being
 * deliberately NOT httpOnly) has to be read from the cookie and echoed
 * back as a header for the backend's double-submit check to pass.
 */
export const refreshAccessToken = () =>
  apiClient.post(
    "/api/v1/auth/refresh",
    {},
    { headers: { "x-csrf-token": getCookie(CSRF_COOKIE_NAME) } },
  );

export const logoutUser = (accessToken) =>
  apiClient.post("/api/v1/auth/logout", {}, authHeader(accessToken));

export const getUserProfile = (accessToken) => apiClient.get("/api/v1/auth/me", authHeader(accessToken));

/**
 * Also the endpoint used for a mandatory first-login password change
 * (mustChangePassword: true) -- same handler on the backend either way.
 * Never returns new tokens; the backend revokes every session on success,
 * so the frontend must clear its own auth state and send the user back
 * through a fresh login.
 */
export const forceChangePassword = ({ accessToken, currentPassword, newPassword, confirmPassword }) =>
  apiClient.post(
    "/api/v1/auth/force-change-password",
    { currentPassword, newPassword, confirmPassword },
    authHeader(accessToken),
  );
