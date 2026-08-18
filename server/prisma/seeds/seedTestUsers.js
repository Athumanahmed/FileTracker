import bcrypt from "bcryptjs";
import prisma from "../../config/prisma.js";

const TEST_PASSWORD = "Postman@123";

export async function seedTestUsers() {
  console.log("Seeding test users...");

  const [directorRole, hodRole, supervisorRole, officerRole, registryRole, archiveRole] = await Promise.all([
    prisma.role.findUniqueOrThrow({ where: { code: "DIRECTOR" } }),
    prisma.role.findUniqueOrThrow({ where: { code: "HOD" } }),
    prisma.role.findUniqueOrThrow({ where: { code: "SUPERVISOR" } }),
    prisma.role.findUniqueOrThrow({ where: { code: "OFFICER" } }),
    prisma.role.findUniqueOrThrow({ where: { code: "REGISTRY" } }),
    prisma.role.findUniqueOrThrow({ where: { code: "ARCHIVE" } }),
  ]);

  const ict = await prisma.department.findUniqueOrThrow({ where: { code: "ICT" } });
  const registryDept = await prisma.department.findUniqueOrThrow({ where: { code: "REG" } });
  const dev = await prisma.unit.findUniqueOrThrow({ where: { departmentId_code: { departmentId: ict.id, code: "DEV" } } });
  const softwareEngineer = await prisma.position.findUniqueOrThrow({ where: { unitId_code: { unitId: dev.id, code: "SE" } } });

  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 12);

  const users = [
    {
      username: "hassan.ali",
      firstName: "Hassan",
      lastName: "Ali",
      fullName: "Hassan Ali",
      email: "hassan.ali@eftms.go.tz",
      phoneNumber: "255768156801",
      role: directorRole,
      departmentId: null,
      unitId: null,
      positionId: null,
    },
    {
      username: "CleanCode",
      firstName: "Clean",
      lastName: "Code",
      fullName: "Clean Code",
      email: "cleancode@eftms.go.tz",
      phoneNumber: "255768156802",
      role: hodRole,
      departmentId: ict.id,
      unitId: null,
      positionId: null,
    },
    {
      username: "john.silver",
      firstName: "John",
      lastName: "Silver",
      fullName: "John Silver",
      email: "john.silver@eftms.go.tz",
      phoneNumber: "255768156803",
      role: supervisorRole,
      departmentId: ict.id,
      unitId: dev.id,
      positionId: null,
    },
    {
      username: "officer.one",
      firstName: "Officer",
      lastName: "One",
      fullName: "Officer One",
      email: "officer.one@eftms.go.tz",
      phoneNumber: "255768156804",
      role: officerRole,
      departmentId: ict.id,
      unitId: dev.id,
      positionId: softwareEngineer.id,
    },
    {
      username: "hellen.mcgraw",
      firstName: "Hellen",
      lastName: "McGraw",
      fullName: "Hellen McGraw",
      email: "hellen.mcgraw@eftms.go.tz",
      phoneNumber: "255768156805",
      role: registryRole,
      departmentId: registryDept.id,
      unitId: null,
      positionId: null,
    },
    {
      username: "conor.thomas",
      firstName: "Conor",
      lastName: "Thomas",
      fullName: "Conor Thomas",
      email: "conor.thomas@eftms.go.tz",
      phoneNumber: "255768156806",
      role: archiveRole,
      departmentId: null,
      unitId: null,
      positionId: null,
    },
  ];

  for (const { role, ...data } of users) {
    const user = await prisma.user.upsert({
      where: { username: data.username },
      update: {},
      create: {
        ...data,
        passwordHash,
        mustChangePassword: false,
        status: "ACTIVE",
        isActive: true,
      },
    });

    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: role.id } },
      update: {},
      create: { userId: user.id, roleId: role.id },
    });
  }

  console.log(`Test users seeded (password for all: ${TEST_PASSWORD}).`);
}
