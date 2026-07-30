import prisma from "../../config/prisma.js";

export async function seedDepartments() {
  console.log("Seeding departments...");

  const departments = [
    { name: "ICT", code: "ICT" },
    { name: "Finance", code: "FIN" },
    { name: "Human Resource", code: "HR" },
    { name: "Planning", code: "PLAN" },
    { name: "Registry", code: "REG" },
    { name: "Legal", code: "LEGAL" },
    { name: "Procurement", code: "PROC" },
  ];

  for (const department of departments) {
    await prisma.department.upsert({
      where: { code: department.code },
      update: {},
      create: department,
    });
  }

  console.log("Departments seeded.");
}
