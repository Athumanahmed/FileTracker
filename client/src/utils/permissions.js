// Mirrors server/prisma/seeds/seedPermissions.js's `code` values exactly --
// these are matched against the deduplicated user.permissions[] code list
// from GET /auth/me. Only the codes the frontend currently gates on are
// listed here; add more as each module's UI is built.
export const PERMISSIONS = {
  USERS_READ: "USERS.READ",
  DEPARTMENTS_READ: "DEPARTMENTS.READ",
  UNITS_READ: "UNITS.READ",
  POSITIONS_READ: "POSITIONS.READ",
  ROLES_READ: "ROLES.READ",
  PERMISSIONS_READ: "PERMISSIONS.READ",
  ROLE_PERMISSIONS_READ: "ROLE_PERMISSIONS.READ",
};
