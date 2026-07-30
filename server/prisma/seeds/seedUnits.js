import prisma from "../../config/prisma.js";

export async function seedUnits() {
  console.log("Seeding units...");

  const ict = await prisma.department.findUnique({
    where: { code: "ICT" },
  });

  const finance = await prisma.department.findUnique({
    where: { code: "FIN" },
  });

  const units = [
    {
      departmentId: ict.id,
      name: "Software Development",
      code: "DEV",
    },
    {
      departmentId: ict.id,
      name: "Network Administration",
      code: "NET",
    },
    {
      departmentId: finance.id,
      name: "Revenue",
      code: "REV",
    },
  ];

  for (const unit of units) {
    await prisma.unit.upsert({
      where: {
        departmentId_code: {
          departmentId: unit.departmentId,
          code: unit.code,
        },
      },
      update: {},
      create: unit,
    });
  }

  console.log("Units seeded.");
}
