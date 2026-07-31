import prisma from "../../config/prisma.js";

/**
 * These two permissions let a Super Administrator create ANOTHER Super
 * Administrator, or create a Department Officer directly (bypassing the
 * Unit Supervisor). Per the organizational hierarchy design, both are
 * escalation-risk overrides that must be opt-in, never granted by
 * default -- so SYSTEM_ADMIN's blanket grant below deliberately skips them.
 * Grant them explicitly later (via a role-management UI) only if the
 * business genuinely needs the override.
 */
const ESCALATION_ONLY_PERMISSIONS = ["USERS.CREATE.SUPER_ADMIN", "USERS.CREATE.OFFICER"];

/**
 * Permissions granted to non-SYSTEM_ADMIN roles, keyed by role code.
 * This is where the "who can create whom" hierarchy actually gets wired
 * into the database -- see config/organizationalHierarchy.js for the
 * matrix this mirrors.
 */
const EXPLICIT_ROLE_PERMISSIONS = {
  HOD: ["USERS.CREATE.SUPERVISOR"],
  SUPERVISOR: ["USERS.CREATE.OFFICER"],
};

export async function seedRolePermissions() {
  console.log("Assigning permissions...");

  const roles = await prisma.role.findMany();
  const permissions = await prisma.permission.findMany();
  const permissionByCode = new Map(permissions.map((permission) => [permission.code, permission]));

  const grant = (roleId, permissionId) =>
    prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId, permissionId } },
      update: {},
      create: { roleId, permissionId },
    });

  const systemAdmin = roles.find((role) => role.code === "SYSTEM_ADMIN");
  if (systemAdmin) {
    for (const permission of permissions) {
      if (ESCALATION_ONLY_PERMISSIONS.includes(permission.code)) continue;
      await grant(systemAdmin.id, permission.id);
    }
  }

  for (const [roleCode, permissionCodes] of Object.entries(EXPLICIT_ROLE_PERMISSIONS)) {
    const role = roles.find((r) => r.code === roleCode);
    if (!role) continue;

    for (const code of permissionCodes) {
      const permission = permissionByCode.get(code);
      if (!permission) continue;
      await grant(role.id, permission.id);
    }
  }

  console.log("Permissions assigned.");
}
