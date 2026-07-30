import prisma from "../../config/prisma.js";

export async function seedRolePermissions() {
  console.log("Assigning permissions...");

  const admin = await prisma.role.findUnique({
    where: { code: "SYSTEM_ADMIN" },
  });

  const permissions = await prisma.permission.findMany();

  for (const permission of permissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: admin.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: admin.id,
        permissionId: permission.id,
      },
    });
  }

  console.log("Permissions assigned.");
}
