/**
 * Single source of truth for password complexity, shared by every flow
 * that lets a user set a new password (forgot-password reset, first-login
 * force-change, and any future change-password endpoint) so the rule can
 * never drift between them.
 */
export const PASSWORD_COMPLEXITY_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export const PASSWORD_COMPLEXITY_MESSAGE =
  "Password must include an uppercase letter, a lowercase letter, a number, and a special character";
