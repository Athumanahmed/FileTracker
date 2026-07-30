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

    // Roles
    { code: "ROLES.CREATE", name: "Create Role", module: "AUTHORIZATION" },
    { code: "ROLES.READ", name: "View Roles", module: "AUTHORIZATION" },
    { code: "ROLES.UPDATE", name: "Update Role", module: "AUTHORIZATION" },
    { code: "ROLES.DELETE", name: "Delete Role", module: "AUTHORIZATION" },

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
