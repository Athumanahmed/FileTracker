// Mirrors server/prisma/seeds/seedPermissions.js's `code` values exactly --
// these are matched against the deduplicated user.permissions[] code list
// from GET /auth/me. Only the codes the frontend currently gates on are
// listed here; add more as each module's UI is built.
export const PERMISSIONS = {
  USERS_READ: "USERS.READ",
  DEPARTMENTS_READ: "DEPARTMENTS.READ",
  DEPARTMENTS_CREATE: "DEPARTMENTS.CREATE",
  UNITS_READ: "UNITS.READ",
  UNITS_CREATE: "UNITS.CREATE",
  POSITIONS_READ: "POSITIONS.READ",
  POSITIONS_CREATE: "POSITIONS.CREATE",
  ROLES_READ: "ROLES.READ",
  PERMISSIONS_READ: "PERMISSIONS.READ",
  ROLE_PERMISSIONS_READ: "ROLE_PERMISSIONS.READ",

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
};
