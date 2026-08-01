import prisma from "../../config/prisma.js";

export async function seedPermissions() {
  console.log("Seeding permissions...");

  const permissions = [
    // Authentication
    { code: "AUTH.LOGIN", name: "Login", module: "AUTHENTICATION" },
    { code: "AUTH.LOGOUT", name: "Logout", module: "AUTHENTICATION" },

    // Users
    { code: "USERS.CREATE", name: "Create User", module: "USERS" },
    { code: "USERS.READ", name: "View Users", module: "USERS" },
    { code: "USERS.UPDATE", name: "Update User", module: "USERS" },
    { code: "USERS.DELETE", name: "Delete User", module: "USERS" },

    // User creation -- organizational hierarchy (see config/organizationalHierarchy.js).
    // Granular per-target-role permissions, distinct from the generic USERS.CREATE above.
    { code: "USERS.CREATE.DIRECTOR", name: "Create Municipal Director", module: "USERS" },
    { code: "USERS.CREATE.HOD", name: "Create Head of Department", module: "USERS" },
    { code: "USERS.CREATE.SUPERVISOR", name: "Create Unit Supervisor", module: "USERS" },
    { code: "USERS.CREATE.OFFICER", name: "Create Department Officer", module: "USERS" },
    { code: "USERS.CREATE.REGISTRY", name: "Create Registry Officer", module: "USERS" },
    { code: "USERS.CREATE.ARCHIVE", name: "Create Archive Officer", module: "USERS" },
    { code: "USERS.CREATE.ICT_ADMIN", name: "Create ICT Administrator", module: "USERS" },
    {
      code: "USERS.CREATE.SUPER_ADMIN",
      name: "Create Super Administrator",
      module: "USERS",
    },

    // User account management -- deliberately separate from USERS.UPDATE,
    // each one gates a distinct, independently-audited administrative action.
    { code: "USERS.ACTIVATE", name: "Activate User Account", module: "USERS" },
    { code: "USERS.DEACTIVATE", name: "Deactivate User Account", module: "USERS" },
    { code: "USERS.LOCK", name: "Lock User Account", module: "USERS" },
    { code: "USERS.UNLOCK", name: "Unlock User Account", module: "USERS" },
    { code: "USERS.RESET_PASSWORD", name: "Reset User Password", module: "USERS" },
    { code: "USERS.ROLES.ASSIGN", name: "Assign Role To User", module: "USERS" },
    { code: "USERS.ROLES.REMOVE", name: "Remove Role From User", module: "USERS" },

    // Roles
    { code: "ROLES.CREATE", name: "Create Role", module: "AUTHORIZATION" },
    { code: "ROLES.READ", name: "View Roles", module: "AUTHORIZATION" },
    { code: "ROLES.UPDATE", name: "Update Role", module: "AUTHORIZATION" },
    { code: "ROLES.DELETE", name: "Delete Role", module: "AUTHORIZATION" },

    // Permissions
    { code: "PERMISSIONS.CREATE", name: "Create Permission", module: "AUTHORIZATION" },
    { code: "PERMISSIONS.READ", name: "View Permissions", module: "AUTHORIZATION" },
    { code: "PERMISSIONS.UPDATE", name: "Update Permission", module: "AUTHORIZATION" },
    { code: "PERMISSIONS.DELETE", name: "Delete Permission", module: "AUTHORIZATION" },

    // Role <-> Permission assignments (the RolePermission join table has no
    // CRUD lifecycle of its own -- these are verb-based, not CRUD-based).
    { code: "ROLE_PERMISSIONS.READ", name: "View Role Permission Assignments", module: "AUTHORIZATION" },
    { code: "ROLE_PERMISSIONS.ASSIGN", name: "Assign Permission To Role", module: "AUTHORIZATION" },
    { code: "ROLE_PERMISSIONS.REVOKE", name: "Revoke Permission From Role", module: "AUTHORIZATION" },

    // Departments
    {
      code: "DEPARTMENTS.CREATE",
      name: "Create Department",
      module: "DEPARTMENTS",
    },
    {
      code: "DEPARTMENTS.READ",
      name: "View Departments",
      module: "DEPARTMENTS",
    },
    {
      code: "DEPARTMENTS.UPDATE",
      name: "Update Department",
      module: "DEPARTMENTS",
    },
    {
      code: "DEPARTMENTS.DELETE",
      name: "Delete Department",
      module: "DEPARTMENTS",
    },

    // Units
    { code: "UNITS.CREATE", name: "Create Unit", module: "UNITS" },
    { code: "UNITS.READ", name: "View Units", module: "UNITS" },
    { code: "UNITS.UPDATE", name: "Update Unit", module: "UNITS" },
    { code: "UNITS.DELETE", name: "Delete Unit", module: "UNITS" },

    // Positions
    { code: "POSITIONS.CREATE", name: "Create Position", module: "POSITIONS" },
    { code: "POSITIONS.READ", name: "View Positions", module: "POSITIONS" },
    { code: "POSITIONS.UPDATE", name: "Update Position", module: "POSITIONS" },
    { code: "POSITIONS.DELETE", name: "Delete Position", module: "POSITIONS" },

    // Dashboard -- aggregate views spanning multiple modules, so they get
    // their own permission rather than piggybacking on any single module's.
    {
      code: "DASHBOARD.READ_ADMIN_SUMMARY",
      name: "View Admin Dashboard Summary",
      module: "DASHBOARD",
    },
  ];

  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: { code: permission.code },
      update: {},
      create: permission,
    });
  }

  console.log("Permissions seeded.");
}
