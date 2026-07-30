import bcrypt from "bcryptjs";
import prisma from "../../config/prisma.js";

export async function seedAdmin() {
  console.log("Creating administrator...");

  const role = await prisma.role.findUnique({
    where: { code: "SYSTEM_ADMIN" },
  });

  const passwordHash = await bcrypt.hash("ChangeMe@123", 12);

  const admin = await prisma.user.upsert({
    where: {
      username: "admin",
    },
    update: {},
    create: {
      firstName: "System",
      lastName: "Administrator",
      fullName: "System Administrator",
      username: "admin",
      email: "admin@eftms.go.tz",
      phoneNumber: "255700000000",
      passwordHash,
      mustChangePassword: true,
      status: "ACTIVE",
      isActive: true,
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: admin.id,
        roleId: role.id,
      },
    },
    update: {},
    create: {
      userId: admin.id,
      roleId: role.id,
    },
  });

  console.log("Administrator created.");
}
