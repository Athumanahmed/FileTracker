import apiClient from "./apiClient";
import { API_ENDPOINTS } from "./apiEndpoints";
import { getCookie, CSRF_COOKIE_NAME } from "./cookies";

const authHeader = (token) => ({
  headers: { Authorization: `Bearer ${token}` },
});

/**
 * For multipart/form-data requests specifically. apiClient sets a hardcoded
 * instance-level default of "Content-Type: application/json" (see
 * apiClient.js) -- axios's transformRequest checks that header, not the
 * body's actual type, so without this override it silently JSON-stringifies
 * the FormData instead of sending it as multipart (every File collapses to
 * "{}", since JSON.stringify(File) has no own enumerable properties to
 * serialize -- no error, just empty attachments server-side). Explicitly
 * unsetting Content-Type is the axios-documented fix (see
 * node_modules/axios/lib/helpers/resolveConfig.js's own
 * `headers.setContentType(undefined)` for the same scenario) -- it lets the
 * browser generate the correct "multipart/form-data; boundary=..." itself.
 */
const multipartAuthHeader = (token) => ({
  headers: { Authorization: `Bearer ${token}`, "Content-Type": undefined },
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

// Voluntary "change my password" -- backend routes this to the exact same
// handler as force-change-password (see server/routes/auth.routes.js's own
// comment), but this is the discoverable name for a user choosing to do it
// from Account Settings rather than being forced to on first login.
export const changePassword = ({ accessToken, currentPassword, newPassword, confirmPassword }) =>
  apiClient.post(
    API_ENDPOINTS.AUTH.CHANGE_PASSWORD,
    { currentPassword, newPassword, confirmPassword },
    authHeader(accessToken),
  );

export const getMySessions = (accessToken) => apiClient.get(API_ENDPOINTS.AUTH.SESSIONS, authHeader(accessToken));

export const revokeSession = (accessToken, sessionId) =>
  apiClient.delete(API_ENDPOINTS.AUTH.REVOKE_SESSION(sessionId), authHeader(accessToken));

export const logoutAllDevices = (accessToken) => apiClient.post(API_ENDPOINTS.AUTH.LOGOUT_ALL, {}, authHeader(accessToken));

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

export const updateAdminUser = (accessToken, userId, payload) =>
  apiClient.put(API_ENDPOINTS.USERS.ADMIN_DETAIL(userId), payload, authHeader(accessToken));

export const activateAdminUser = (accessToken, userId) =>
  apiClient.patch(API_ENDPOINTS.USERS.ADMIN_ACTIVATE(userId), {}, authHeader(accessToken));

export const deactivateAdminUser = (accessToken, userId) =>
  apiClient.patch(API_ENDPOINTS.USERS.ADMIN_DEACTIVATE(userId), {}, authHeader(accessToken));

export const lockAdminUser = (accessToken, userId) =>
  apiClient.patch(API_ENDPOINTS.USERS.ADMIN_LOCK(userId), {}, authHeader(accessToken));

export const unlockAdminUser = (accessToken, userId) =>
  apiClient.patch(API_ENDPOINTS.USERS.ADMIN_UNLOCK(userId), {}, authHeader(accessToken));

// Returns { username, newPassword } -- the generated password is shown
// exactly once, same one-time-reveal contract as user creation.
export const resetAdminUserPassword = (accessToken, userId) =>
  apiClient.post(API_ENDPOINTS.USERS.ADMIN_RESET_PASSWORD(userId), {}, authHeader(accessToken));

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

export const createSupervisor = (accessToken, payload) =>
  apiClient.post(API_ENDPOINTS.USERS.CREATE_SUPERVISOR, payload, authHeader(accessToken));

export const createOfficer = (accessToken, payload) =>
  apiClient.post(API_ENDPOINTS.USERS.CREATE_OFFICER, payload, authHeader(accessToken));

export const updateOwnProfile = (accessToken, payload) =>
  apiClient.put(API_ENDPOINTS.USERS.UPDATE_OWN_PROFILE, payload, authHeader(accessToken));

// -- Organizational lookups (for filter dropdowns etc.) ----------------------

export const getDepartments = (accessToken, params = {}) =>
  apiClient.get(API_ENDPOINTS.DEPARTMENTS.LIST, { ...authHeader(accessToken), params });

export const getDepartmentStats = (accessToken) =>
  apiClient.get(API_ENDPOINTS.DEPARTMENTS.STATS, authHeader(accessToken));

export const getDepartmentById = (accessToken, id) =>
  apiClient.get(API_ENDPOINTS.DEPARTMENTS.DETAIL(id), authHeader(accessToken));

export const createDepartment = (accessToken, payload) =>
  apiClient.post(API_ENDPOINTS.DEPARTMENTS.CREATE, payload, authHeader(accessToken));

export const updateDepartment = (accessToken, id, payload) =>
  apiClient.put(API_ENDPOINTS.DEPARTMENTS.UPDATE(id), payload, authHeader(accessToken));

export const deactivateDepartment = (accessToken, id) =>
  apiClient.patch(API_ENDPOINTS.DEPARTMENTS.DEACTIVATE(id), {}, authHeader(accessToken));

export const reactivateDepartment = (accessToken, id) =>
  apiClient.patch(API_ENDPOINTS.DEPARTMENTS.REACTIVATE(id), {}, authHeader(accessToken));

export const getUnits = (accessToken, params = {}) =>
  apiClient.get(API_ENDPOINTS.UNITS.LIST, { ...authHeader(accessToken), params });

export const getUnitStats = (accessToken) =>
  apiClient.get(API_ENDPOINTS.UNITS.STATS, authHeader(accessToken));

export const getUnitById = (accessToken, id) =>
  apiClient.get(API_ENDPOINTS.UNITS.DETAIL(id), authHeader(accessToken));

export const createUnit = (accessToken, payload) =>
  apiClient.post(API_ENDPOINTS.UNITS.CREATE, payload, authHeader(accessToken));

export const updateUnit = (accessToken, id, payload) =>
  apiClient.put(API_ENDPOINTS.UNITS.UPDATE(id), payload, authHeader(accessToken));

export const deactivateUnit = (accessToken, id) =>
  apiClient.patch(API_ENDPOINTS.UNITS.DEACTIVATE(id), {}, authHeader(accessToken));

export const reactivateUnit = (accessToken, id) =>
  apiClient.patch(API_ENDPOINTS.UNITS.REACTIVATE(id), {}, authHeader(accessToken));

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

export const getRoleById = (accessToken, id) =>
  apiClient.get(API_ENDPOINTS.ROLES.DETAIL(id), authHeader(accessToken));

export const createRole = (accessToken, payload) =>
  apiClient.post(API_ENDPOINTS.ROLES.CREATE, payload, authHeader(accessToken));

export const updateRole = (accessToken, id, payload) =>
  apiClient.put(API_ENDPOINTS.ROLES.UPDATE(id), payload, authHeader(accessToken));

export const deactivateRole = (accessToken, id) =>
  apiClient.patch(API_ENDPOINTS.ROLES.DEACTIVATE(id), {}, authHeader(accessToken));

export const reactivateRole = (accessToken, id) =>
  apiClient.patch(API_ENDPOINTS.ROLES.REACTIVATE(id), {}, authHeader(accessToken));

// -- Permissions ---------------------------------------------------------

export const getPermissions = (accessToken, params = {}) =>
  apiClient.get(API_ENDPOINTS.PERMISSIONS.LIST, { ...authHeader(accessToken), params });

export const getPermissionStats = (accessToken) =>
  apiClient.get(API_ENDPOINTS.PERMISSIONS.STATS, authHeader(accessToken));

export const getPermissionById = (accessToken, id) =>
  apiClient.get(API_ENDPOINTS.PERMISSIONS.DETAIL(id), authHeader(accessToken));

export const createPermission = (accessToken, payload) =>
  apiClient.post(API_ENDPOINTS.PERMISSIONS.CREATE, payload, authHeader(accessToken));

export const updatePermission = (accessToken, id, payload) =>
  apiClient.put(API_ENDPOINTS.PERMISSIONS.UPDATE(id), payload, authHeader(accessToken));

export const deactivatePermission = (accessToken, id) =>
  apiClient.patch(API_ENDPOINTS.PERMISSIONS.DEACTIVATE(id), {}, authHeader(accessToken));

export const reactivatePermission = (accessToken, id) =>
  apiClient.patch(API_ENDPOINTS.PERMISSIONS.REACTIVATE(id), {}, authHeader(accessToken));

// -- Role Permissions ------------------------------------------------------

export const getRolePermissions = (accessToken, params = {}) =>
  apiClient.get(API_ENDPOINTS.ROLE_PERMISSIONS.LIST, { ...authHeader(accessToken), params });

export const syncRolePermissions = (accessToken, payload) =>
  apiClient.post(API_ENDPOINTS.ROLE_PERMISSIONS.SYNC, payload, authHeader(accessToken));

// -- Dashboard ---------------------------------------------------------------

export const getAdminDashboardSummary = (accessToken) =>
  apiClient.get(API_ENDPOINTS.DASHBOARD.ADMIN_SUMMARY, authHeader(accessToken));

export const getAdminRecentActivity = (accessToken, limit = 10) =>
  apiClient.get(API_ENDPOINTS.DASHBOARD.ADMIN_RECENT_ACTIVITY, {
    ...authHeader(accessToken),
    params: { limit },
  });

export const getAdminAuditLogs = (accessToken, params = {}) =>
  apiClient.get(API_ENDPOINTS.DASHBOARD.ADMIN_AUDIT_LOGS, { ...authHeader(accessToken), params });

export const getAdminAuditLogEntityOptions = (accessToken) =>
  apiClient.get(API_ENDPOINTS.DASHBOARD.ADMIN_AUDIT_LOG_ENTITIES, authHeader(accessToken));

export const getScopedDashboardSummary = (accessToken) =>
  apiClient.get(API_ENDPOINTS.DASHBOARD.SCOPED_SUMMARY, authHeader(accessToken));

export const getScopedRecentActivity = (accessToken, limit = 10) =>
  apiClient.get(API_ENDPOINTS.DASHBOARD.SCOPED_RECENT_ACTIVITY, {
    ...authHeader(accessToken),
    params: { limit },
  });

export const getMyRecentActivity = (accessToken, limit = 10) =>
  apiClient.get(API_ENDPOINTS.DASHBOARD.MY_RECENT_ACTIVITY, {
    ...authHeader(accessToken),
    params: { limit },
  });

// -- Files (File Lifecycle Management) ---------------------------------------

export const getFiles = (accessToken, params = {}) =>
  apiClient.get(API_ENDPOINTS.FILES.LIST, { ...authHeader(accessToken), params });

export const getFileById = (accessToken, fileId) =>
  apiClient.get(API_ENDPOINTS.FILES.DETAIL(fileId), authHeader(accessToken));

export const createFile = (accessToken, formData) =>
  apiClient.post(API_ENDPOINTS.FILES.CREATE, formData, multipartAuthHeader(accessToken));

// -- File Categories (lookup) ---------------------------------------------------

export const getFileCategories = (accessToken) =>
  apiClient.get(API_ENDPOINTS.FILE_CATEGORIES.LIST, authHeader(accessToken));

// -- Search (Redis-cached global search across files + citizens) -------------

export const globalSearch = (accessToken, params = {}) =>
  apiClient.get(API_ENDPOINTS.SEARCH.GLOBAL, { ...authHeader(accessToken), params });

// -- Attachments ---------------------------------------------------------------
// Uploads pass a FormData body -- axios detects it and lets the browser set
// the multipart boundary itself, overriding apiClient's JSON default
// (see node_modules/axios/lib/defaults/index.js's isFormData branch), so no
// manual Content-Type handling is needed here.

export const getFileAttachments = (accessToken, fileId) =>
  apiClient.get(API_ENDPOINTS.ATTACHMENTS.LIST_FOR_FILE(fileId), authHeader(accessToken));

export const uploadAttachment = (accessToken, fileId, formData) =>
  apiClient.post(API_ENDPOINTS.ATTACHMENTS.UPLOAD_FOR_FILE(fileId), formData, multipartAuthHeader(accessToken));

export const replaceAttachment = (accessToken, attachmentId, formData) =>
  apiClient.post(API_ENDPOINTS.ATTACHMENTS.REPLACE(attachmentId), formData, multipartAuthHeader(accessToken));

export const deleteAttachment = (accessToken, attachmentId) =>
  apiClient.delete(API_ENDPOINTS.ATTACHMENTS.DELETE(attachmentId), authHeader(accessToken));

/** responseType: "blob" -- caller turns this into an object URL to trigger a download or open an inline preview tab. */
export const downloadAttachmentFile = (accessToken, attachmentId) =>
  apiClient.get(API_ENDPOINTS.ATTACHMENTS.DOWNLOAD(attachmentId), { ...authHeader(accessToken), responseType: "blob" });

export const previewAttachmentFile = (accessToken, attachmentId) =>
  apiClient.get(API_ENDPOINTS.ATTACHMENTS.PREVIEW(attachmentId), { ...authHeader(accessToken), responseType: "blob" });

// -- Workflow Templates --------------------------------------------------------
// getWorkflowTemplates doubles as the Start Workflow picker lookup and the
// admin directory's paginated list -- same GET /workflow-templates endpoint,
// just different query params.

export const getWorkflowTemplates = (accessToken, params = {}) =>
  apiClient.get(API_ENDPOINTS.WORKFLOW_TEMPLATES.LIST, { ...authHeader(accessToken), params });

export const getWorkflowTemplateById = (accessToken, id) =>
  apiClient.get(API_ENDPOINTS.WORKFLOW_TEMPLATES.DETAIL(id), authHeader(accessToken));

export const createWorkflowTemplate = (accessToken, payload) =>
  apiClient.post(API_ENDPOINTS.WORKFLOW_TEMPLATES.CREATE, payload, authHeader(accessToken));

export const updateWorkflowTemplate = (accessToken, id, payload) =>
  apiClient.put(API_ENDPOINTS.WORKFLOW_TEMPLATES.UPDATE(id), payload, authHeader(accessToken));

export const deactivateWorkflowTemplate = (accessToken, id) =>
  apiClient.patch(API_ENDPOINTS.WORKFLOW_TEMPLATES.DEACTIVATE(id), {}, authHeader(accessToken));

export const reactivateWorkflowTemplate = (accessToken, id) =>
  apiClient.patch(API_ENDPOINTS.WORKFLOW_TEMPLATES.REACTIVATE(id), {}, authHeader(accessToken));

export const addWorkflowTemplateStep = (accessToken, id, payload) =>
  apiClient.post(API_ENDPOINTS.WORKFLOW_TEMPLATES.STEPS(id), payload, authHeader(accessToken));

export const updateWorkflowTemplateStep = (accessToken, id, stepId, payload) =>
  apiClient.put(API_ENDPOINTS.WORKFLOW_TEMPLATES.STEP_UPDATE(id, stepId), payload, authHeader(accessToken));

export const deactivateWorkflowTemplateStep = (accessToken, id, stepId) =>
  apiClient.patch(API_ENDPOINTS.WORKFLOW_TEMPLATES.STEP_DEACTIVATE(id, stepId), {}, authHeader(accessToken));

// -- Workflow Engine -------------------------------------------------------------

export const getFileWorkflowStatus = (accessToken, fileId) =>
  apiClient.get(API_ENDPOINTS.WORKFLOW.STATUS(fileId), authHeader(accessToken));

export const startFileWorkflow = (accessToken, fileId, payload) =>
  apiClient.post(API_ENDPOINTS.WORKFLOW.START(fileId), payload, authHeader(accessToken));

export const transitionFileWorkflow = (accessToken, fileId, payload) =>
  apiClient.post(API_ENDPOINTS.WORKFLOW.TRANSITION(fileId), payload, authHeader(accessToken));

export const claimWorkflowAssignment = (accessToken, fileId) =>
  apiClient.post(API_ENDPOINTS.WORKFLOW.CLAIM(fileId), {}, authHeader(accessToken));

/** { constrained, users: [{id, fullName, username, department}] } -- who the given action can actually route to, based on the relevant step's role/position requirement. */
export const getEligibleWorkflowTargets = (accessToken, fileId, action) =>
  apiClient.get(API_ENDPOINTS.WORKFLOW.ELIGIBLE_TARGETS(fileId), { ...authHeader(accessToken), params: { action } });

/** Escalation-ready: every current assignment (any file) already past its SLA-derived due date. Not paginated -- meant to stay a short list. */
export const getOverdueAssignments = (accessToken) =>
  apiClient.get(API_ENDPOINTS.WORKFLOW.OVERDUE, authHeader(accessToken));

export const getFileMovements = (accessToken, fileId, params = {}) =>
  apiClient.get(API_ENDPOINTS.WORKFLOW.MOVEMENTS(fileId), { ...authHeader(accessToken), params });

// -- Minutes ---------------------------------------------------------------------

export const getFileMinutes = (accessToken, fileId) =>
  apiClient.get(API_ENDPOINTS.MINUTES.LIST_FOR_FILE(fileId), authHeader(accessToken));

export const createFileMinute = (accessToken, fileId, formData) =>
  apiClient.post(API_ENDPOINTS.MINUTES.CREATE_FOR_FILE(fileId), formData, multipartAuthHeader(accessToken));

export const replyToMinute = (accessToken, minuteId, formData) =>
  apiClient.post(API_ENDPOINTS.MINUTES.REPLY(minuteId), formData, multipartAuthHeader(accessToken));

export const deleteMinute = (accessToken, minuteId) =>
  apiClient.delete(API_ENDPOINTS.MINUTES.DELETE(minuteId), authHeader(accessToken));

// -- Timeline (read-only) ---------------------------------------------------------

export const getFileTimeline = (accessToken, fileId, params = {}) =>
  apiClient.get(API_ENDPOINTS.TIMELINE.LIST_FOR_FILE(fileId), { ...authHeader(accessToken), params });

// -- Archive -----------------------------------------------------------------------

export const getFileArchiveStatus = (accessToken, fileId) =>
  apiClient.get(API_ENDPOINTS.ARCHIVE.STATUS_FOR_FILE(fileId), authHeader(accessToken));

export const archiveFile = (accessToken, fileId, payload) =>
  apiClient.post(API_ENDPOINTS.ARCHIVE.ARCHIVE_FILE(fileId), payload, authHeader(accessToken));

export const restoreFile = (accessToken, fileId, payload) =>
  apiClient.post(API_ENDPOINTS.ARCHIVE.RESTORE_FILE(fileId), payload, authHeader(accessToken));

/** Escalation/destruction-review queue -- every archived file already past its retention window. Not paginated -- meant to stay a short list. */
export const getExpiredRetention = (accessToken) =>
  apiClient.get(API_ENDPOINTS.ARCHIVE.EXPIRED_RETENTION, authHeader(accessToken));

/** Archive Dashboard aggregates -- ready/archived/restored counts, retention-runway buckets, archived-per-month, upcoming expiries. */
export const getArchiveStats = (accessToken) =>
  apiClient.get(API_ENDPOINTS.ARCHIVE.STATS, authHeader(accessToken));

// -- Citizens ------------------------------------------------------------------

/** Registry toggle for the citizen-facing SMS milestone alerts. */
export const setCitizenSmsPreference = (accessToken, citizenId, smsNotificationsEnabled) =>
  apiClient.patch(API_ENDPOINTS.CITIZENS.SMS_PREFERENCE(citizenId), { smsNotificationsEnabled }, authHeader(accessToken));

// -- Notifications ---------------------------------------------------------------
// Every endpoint here is self-scoped (identity from the token, no :userId) --
// no permission gate beyond being authenticated, same as the backend.

export const getMyNotifications = (accessToken, params = {}) =>
  apiClient.get(API_ENDPOINTS.NOTIFICATIONS.LIST, { ...authHeader(accessToken), params });

export const markNotificationRead = (accessToken, notificationId) =>
  apiClient.patch(API_ENDPOINTS.NOTIFICATIONS.MARK_READ(notificationId), {}, authHeader(accessToken));

export const markAllNotificationsRead = (accessToken) =>
  apiClient.patch(API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ, {}, authHeader(accessToken));

export const getMyNotificationPreferences = (accessToken) =>
  apiClient.get(API_ENDPOINTS.NOTIFICATIONS.PREFERENCES, authHeader(accessToken));

export const setMyNotificationPreference = (accessToken, payload) =>
  apiClient.put(API_ENDPOINTS.NOTIFICATIONS.PREFERENCES, payload, authHeader(accessToken));

// -- Reports & Dashboard (File Lifecycle Management) --------------------------
// params.departmentId is honored for management roles (SYSTEM_ADMIN/DIRECTOR/
// SUPERVISOR) and ignored server-side for HOD (always their own department) --
// see server/services/report.service.js#resolveScopedDepartmentId.

export const getReportDashboardKpis = (accessToken, params = {}) =>
  apiClient.get(API_ENDPOINTS.REPORTS.DASHBOARD, { ...authHeader(accessToken), params });

export const getStatusDistribution = (accessToken, params = {}) =>
  apiClient.get(API_ENDPOINTS.REPORTS.STATUS_DISTRIBUTION, { ...authHeader(accessToken), params });

export const getRegistrationsOverTime = (accessToken, params = {}) =>
  apiClient.get(API_ENDPOINTS.REPORTS.REGISTRATIONS_OVER_TIME, { ...authHeader(accessToken), params });

export const getDepartmentPerformance = (accessToken, params = {}) =>
  apiClient.get(API_ENDPOINTS.REPORTS.DEPARTMENT_PERFORMANCE, { ...authHeader(accessToken), params });

export const getOfficerPerformance = (accessToken, params = {}) =>
  apiClient.get(API_ENDPOINTS.REPORTS.OFFICER_PERFORMANCE, { ...authHeader(accessToken), params });

/** responseType: "blob" -- returns a real file (CSV/Excel/PDF), not JSON. Caller reads Content-Disposition for the filename and triggers a browser download. */
export const exportReport = (accessToken, params) =>
  apiClient.get(API_ENDPOINTS.REPORTS.EXPORT, { ...authHeader(accessToken), params, responseType: "blob" });
