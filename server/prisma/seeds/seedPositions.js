import prisma from "../../config/prisma.js";

export async function seedPositions() {
  console.log("Seeding positions...");

  const dev = await prisma.unit.findUnique({
    where: {
      departmentId_code: {
        departmentId: (
          await prisma.department.findUnique({
            where: { code: "ICT" },
          })
        ).id,
        code: "DEV",
      },
    },
  });

  const positions = [
    {
      unitId: dev.id,
      title: "Software Engineer",
      code: "SE",
      rank: 4,
      positionType: "OPERATIONAL",
    },
    {
      unitId: dev.id,
      title: "Head of ICT",
      code: "HICT",
      rank: 2,
      positionType: "MANAGEMENT",
      isHead: true,
    },
  ];

  for (const position of positions) {
    await prisma.position.upsert({
      where: {
        unitId_code: {
          unitId: position.unitId,
          code: position.code,
        },
      },
      update: {},
      create: position,
    });
  }

  console.log("Positions seeded.");
}
