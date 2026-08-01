import apiClient from "./apiClient";
import { API_ENDPOINTS } from "./apiEndpoints";
import { getCookie, CSRF_COOKIE_NAME } from "./cookies";

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

export const getAdminUserStats = (accessToken) =>
  apiClient.get(API_ENDPOINTS.USERS.ADMIN_STATS, authHeader(accessToken));

// -- Users (creation) -- all SYSTEM_ADMIN-creatable, global-scope except HOD ---

export const createDirector = (accessToken, payload) =>
  apiClient.post(API_ENDPOINTS.USERS.CREATE_DIRECTOR, payload, authHeader(accessToken));

export const createHod = (accessToken, payload) =>
  apiClient.post(API_ENDPOINTS.USERS.CREATE_HOD, payload, authHeader(accessToken));

export const createRegistryOfficer = (accessToken, payload) =>
  apiClient.post(API_ENDPOINTS.USERS.CREATE_REGISTRY_OFFICER, payload, authHeader(accessToken));

export const createArchiveOfficer = (accessToken, payload) =>
  apiClient.post(API_ENDPOINTS.USERS.CREATE_ARCHIVE_OFFICER, payload, authHeader(accessToken));

export const createIctAdmin = (accessToken, payload) =>
  apiClient.post(API_ENDPOINTS.USERS.CREATE_ICT_ADMIN, payload, authHeader(accessToken));

// -- Organizational lookups (for filter dropdowns etc.) ----------------------

export const getDepartments = (accessToken, params = {}) =>
  apiClient.get(API_ENDPOINTS.DEPARTMENTS.LIST, { ...authHeader(accessToken), params });

export const getDepartmentStats = (accessToken) =>
  apiClient.get(API_ENDPOINTS.DEPARTMENTS.STATS, authHeader(accessToken));

export const createDepartment = (accessToken, payload) =>
  apiClient.post(API_ENDPOINTS.DEPARTMENTS.CREATE, payload, authHeader(accessToken));

export const getUnits = (accessToken, params = {}) =>
  apiClient.get(API_ENDPOINTS.UNITS.LIST, { ...authHeader(accessToken), params });

export const getUnitStats = (accessToken) =>
  apiClient.get(API_ENDPOINTS.UNITS.STATS, authHeader(accessToken));

export const createUnit = (accessToken, payload) =>
  apiClient.post(API_ENDPOINTS.UNITS.CREATE, payload, authHeader(accessToken));

export const getPositions = (accessToken, params = {}) =>
  apiClient.get(API_ENDPOINTS.POSITIONS.LIST, { ...authHeader(accessToken), params });

export const getPositionStats = (accessToken) =>
  apiClient.get(API_ENDPOINTS.POSITIONS.STATS, authHeader(accessToken));

export const createPosition = (accessToken, payload) =>
  apiClient.post(API_ENDPOINTS.POSITIONS.CREATE, payload, authHeader(accessToken));

export const getRoles = (accessToken, params = {}) =>
  apiClient.get(API_ENDPOINTS.ROLES.LIST, { ...authHeader(accessToken), params });

export const getRoleStats = (accessToken) =>
  apiClient.get(API_ENDPOINTS.ROLES.STATS, authHeader(accessToken));

export const createRole = (accessToken, payload) =>
  apiClient.post(API_ENDPOINTS.ROLES.CREATE, payload, authHeader(accessToken));

// -- Permissions ---------------------------------------------------------

export const getPermissions = (accessToken, params = {}) =>
  apiClient.get(API_ENDPOINTS.PERMISSIONS.LIST, { ...authHeader(accessToken), params });

export const getPermissionStats = (accessToken) =>
  apiClient.get(API_ENDPOINTS.PERMISSIONS.STATS, authHeader(accessToken));

// -- Dashboard ---------------------------------------------------------------

export const getAdminDashboardSummary = (accessToken) =>
  apiClient.get(API_ENDPOINTS.DASHBOARD.ADMIN_SUMMARY, authHeader(accessToken));

export const getAdminRecentActivity = (accessToken, limit = 10) =>
  apiClient.get(API_ENDPOINTS.DASHBOARD.ADMIN_RECENT_ACTIVITY, {
    ...authHeader(accessToken),
    params: { limit },
  });
