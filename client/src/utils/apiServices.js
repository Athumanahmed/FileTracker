import apiClient from "./apiClient";
import { API_ENDPOINTS } from "./apiEndpoints";

// Must match server/config/security.js's CSRF_COOKIE_NAME.
const CSRF_COOKIE_NAME = "eftms_csrf_token";

const getCookie = (name) => {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
};

const authHeader = (token) => ({
  headers: { Authorization: `Bearer ${token}` },
});

export const loginUser = ({ username, password }) =>
  apiClient.post(API_ENDPOINTS.AUTH.LOGIN, { username, password });

export const refreshAccessToken = () =>
  apiClient.post(
    API_ENDPOINTS.AUTH.REFRESH_TOKEN,
    {},
    { headers: { "x-csrf-token": getCookie(CSRF_COOKIE_NAME) } },
  );

export const logoutUser = (accessToken) =>
  apiClient.post(API_ENDPOINTS.AUTH.LOGOUT, {}, authHeader(accessToken));

export const getUserProfile = (accessToken) =>
  apiClient.get(API_ENDPOINTS.AUTH.ME, authHeader(accessToken));

export const forceChangePassword = ({
  accessToken,
  currentPassword,
  newPassword,
  confirmPassword,
}) =>
  apiClient.post(
    API_ENDPOINTS.AUTH.FORCE_CHANGE_PASSWORD,
    { currentPassword, newPassword, confirmPassword },
    authHeader(accessToken),
  );

export const forgotPassword = ({ phoneNumber }) =>
  apiClient.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, { phoneNumber });

export const resendResetOtp = ({ phoneNumber }) =>
  apiClient.post(API_ENDPOINTS.AUTH.RESEND_RESET_OTP, { phoneNumber });

export const verifyResetOtp = ({ phoneNumber, otp }) =>
  apiClient.post(API_ENDPOINTS.AUTH.VERIFY_RESET_OTP, { phoneNumber, otp });

export const resetPassword = ({ resetToken, newPassword, confirmPassword }) =>
  apiClient.post(
    API_ENDPOINTS.AUTH.RESET_PASSWORD,
    { newPassword, confirmPassword },
    authHeader(resetToken),
  );

// -- Users (admin) ----------------------------------------------------------

export const getAdminUsers = (accessToken, params = {}) =>
  apiClient.get(API_ENDPOINTS.USERS.ADMIN_LIST, { ...authHeader(accessToken), params });

export const getAdminUserById = (accessToken, userId) =>
  apiClient.get(API_ENDPOINTS.USERS.ADMIN_DETAIL(userId), authHeader(accessToken));

// -- Dashboard ---------------------------------------------------------------

export const getAdminDashboardSummary = (accessToken) =>
  apiClient.get(API_ENDPOINTS.DASHBOARD.ADMIN_SUMMARY, authHeader(accessToken));

export const getAdminRecentActivity = (accessToken, limit = 10) =>
  apiClient.get(API_ENDPOINTS.DASHBOARD.ADMIN_RECENT_ACTIVITY, {
    ...authHeader(accessToken),
    params: { limit },
  });
