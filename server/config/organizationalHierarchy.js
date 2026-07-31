/**
 * Single source of truth for the "who can create whom, and within what
 * scope" organizational administration model. Every other module
 * (validators, services, seeds) reads from here rather than hard-coding
 * role relationships inline -- adding a future role means editing this
 * file only, not the enforcement logic in userScope.service.js.
 */

/**
 * Lower number = higher authority. Used only for the privilege-escalation
 * guard and future UI sorting/display -- NOT the source of truth for who
 * can create whom (ROLE_CREATION_MATRIX is). Roles at the same level are
 * peers with no creation relationship between them by default.
 */
export const ROLE_HIERARCHY_LEVEL = {
  SYSTEM_ADMIN: 0,
  DIRECTOR: 1,
  HOD: 2,
  SUPERVISOR: 3,
  OFFICER: 4,
  REGISTRY: 4,
  ARCHIVE: 4,
  ICT_ADMIN: 4,
};

/**
 * The organizational scope a role administers, independent of which
 * permissions it happens to hold:
 *  - GLOBAL: no department/unit constraint -- client-supplied ids are
 *    accepted but must be validated to exist/be active.
 *  - DEPARTMENT: creator's own departmentId is always server-injected;
 *    a client-supplied unitId is allowed only if it belongs to that department.
 *  - UNIT: creator's own departmentId AND unitId are always server-injected;
 *    no scope-related client input is used at all.
 *  - NONE: cannot create any account, regardless of permissions held.
 */
export const ADMIN_SCOPE_BY_ROLE = {
  SYSTEM_ADMIN: "GLOBAL",
  HOD: "DEPARTMENT",
  SUPERVISOR: "UNIT",
  DIRECTOR: "NONE",
  REGISTRY: "NONE",
  ARCHIVE: "NONE",
  OFFICER: "NONE",
  ICT_ADMIN: "NONE",
};

/**
 * Closed list of (creator role -> creatable target roles). This is the
 * authoritative "who can create whom" answer -- checked independently of
 * (and in addition to) the permission bit, so a future permission
 * misconfiguration can't silently open an escalation path.
 *
 * SYSTEM_ADMIN -> OFFICER and SYSTEM_ADMIN -> SYSTEM_ADMIN are listed as
 * structurally valid combinations, but nobody holds the permissions that
 * unlock them by default (see seedRolePermissions.js) -- they only become
 * reachable once explicitly granted.
 */
export const ROLE_CREATION_MATRIX = {
  SYSTEM_ADMIN: ["DIRECTOR", "HOD", "REGISTRY", "ARCHIVE", "ICT_ADMIN", "SYSTEM_ADMIN", "OFFICER"],
  HOD: ["SUPERVISOR"],
  SUPERVISOR: ["OFFICER"],
};

/** Permission code -> the single role code it authorizes creating. */
export const USER_CREATION_PERMISSION_MAP = {
  "USERS.CREATE.DIRECTOR": "DIRECTOR",
  "USERS.CREATE.HOD": "HOD",
  "USERS.CREATE.SUPERVISOR": "SUPERVISOR",
  "USERS.CREATE.OFFICER": "OFFICER",
  "USERS.CREATE.REGISTRY": "REGISTRY",
  "USERS.CREATE.ARCHIVE": "ARCHIVE",
  "USERS.CREATE.ICT_ADMIN": "ICT_ADMIN",
  "USERS.CREATE.SUPER_ADMIN": "SYSTEM_ADMIN",
};
