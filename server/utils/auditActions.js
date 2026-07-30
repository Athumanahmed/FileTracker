/**
 * Canonical AuditLog.action values for the auth module, kept in one place
 * so callers can't introduce typo'd/duplicate action strings.
 */
export const AUDIT_ACTIONS = {
  LOGIN_SUCCESS: "LOGIN_SUCCESS",
  LOGIN_FAILED: "LOGIN_FAILED",
  LOGOUT: "LOGOUT",
  TOKEN_REFRESH: "TOKEN_REFRESH",
  PASSWORD_CHANGED: "PASSWORD_CHANGED",
};
