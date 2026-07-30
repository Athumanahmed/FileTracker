import prisma from "../../config/prisma.js";

export async function seedRoles() {
  console.log("Seeding roles...");

  const roles = [
    {
      name: "System Administrator",
      code: "SYSTEM_ADMIN",
      isSystem: true,
    },
    {
      name: "Municipal Director",
      code: "DIRECTOR",
      isSystem: true,
    },
    {
      name: "Head of Department",
      code: "HOD",
      isSystem: true,
    },
    {
      name: "Registry Officer",
      code: "REGISTRY",
      isSystem: true,
    },
    {
      name: "Unit Supervisor",
      code: "SUPERVISOR",
      isSystem: true,
    },
    {
      name: "Department Officer",
      code: "OFFICER",
      isSystem: true,
    },
    {
      name: "Archive Officer",
      code: "ARCHIVE",
      isSystem: true,
    },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { code: role.code },
      update: {},
      create: role,
    });
  }

  console.log("Roles seeded.");
}
