// Mirrors server/prisma/seeds/seedPermissions.js's `code` values exactly --
// these are matched against the deduplicated user.permissions[] code list
// from GET /auth/me. Only the codes the frontend currently gates on are
// listed here; add more as each module's UI is built.
export const PERMISSIONS = {
  USERS_READ: "USERS.READ",
  // Admin-only in practice: only SYSTEM_ADMIN's blanket grant holds this --
  // HOD/SUPERVISOR get USERS.ACTIVATE/DEACTIVATE/LOCK/UNLOCK/RESET_PASSWORD
  // but not USERS.UPDATE (see server/prisma/seeds/seedRolePermissions.js's
  // ACCOUNT_MANAGEMENT_PERMISSIONS), so "Edit User" gates on this
  // specifically rather than assuming every account-management role has it.
  USERS_UPDATE: "USERS.UPDATE",
  DEPARTMENTS_READ: "DEPARTMENTS.READ",
  DEPARTMENTS_CREATE: "DEPARTMENTS.CREATE",
  UNITS_READ: "UNITS.READ",
  UNITS_CREATE: "UNITS.CREATE",
  POSITIONS_READ: "POSITIONS.READ",
  POSITIONS_CREATE: "POSITIONS.CREATE",
  ROLES_READ: "ROLES.READ",
  ROLES_CREATE: "ROLES.CREATE",
  PERMISSIONS_READ: "PERMISSIONS.READ",
  PERMISSIONS_CREATE: "PERMISSIONS.CREATE",
  ROLE_PERMISSIONS_READ: "ROLE_PERMISSIONS.READ",
  ROLE_PERMISSIONS_ASSIGN: "ROLE_PERMISSIONS.ASSIGN",
  ROLE_PERMISSIONS_REVOKE: "ROLE_PERMISSIONS.REVOKE",
  DASHBOARD_READ_SCOPED_SUMMARY: "DASHBOARD.READ_SCOPED_SUMMARY",

  // Granular per-target-role user creation -- see
  // server/config/organizationalHierarchy.js for who actually gets which
  // of these (never all of them, even for SYSTEM_ADMIN).
  USERS_CREATE_DIRECTOR: "USERS.CREATE.DIRECTOR",
  USERS_CREATE_HOD: "USERS.CREATE.HOD",
  USERS_CREATE_SUPERVISOR: "USERS.CREATE.SUPERVISOR",
  USERS_CREATE_OFFICER: "USERS.CREATE.OFFICER",
  USERS_CREATE_REGISTRY: "USERS.CREATE.REGISTRY",
  USERS_CREATE_ARCHIVE: "USERS.CREATE.ARCHIVE",
  USERS_CREATE_ICT_ADMIN: "USERS.CREATE.ICT_ADMIN",
  USERS_CREATE_SUPER_ADMIN: "USERS.CREATE.SUPER_ADMIN",

  // File Lifecycle Management -- mirrors the module built across the
  // backend's Phase 0-11 roadmap. FILES_REGISTER gates the "Register
  // File" action only (reached via a button on the Files page, not its
  // own sidebar entry); FILES_READ gates the Files list/detail branch
  // itself, which every workflow-assignee role holds.
  FILES_REGISTER: "FILES.REGISTER",
  FILES_READ: "FILES.READ",
  WORKFLOW_TEMPLATES_READ: "WORKFLOW_TEMPLATES.READ",
  WORKFLOW_READ: "WORKFLOW.READ",
  WORKFLOW_MANAGE: "WORKFLOW.MANAGE",
  ARCHIVE_READ: "ARCHIVE.READ",
  ARCHIVE_MANAGE: "ARCHIVE.MANAGE",
  REPORTS_READ: "REPORTS.READ",
};
