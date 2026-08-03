import prisma from "../../config/prisma.js";

export async function seedFileCategories() {
  console.log("Seeding file categories...");

  const categories = [
    { name: "General Correspondence", code: "GEN-CORR", defaultRetentionYears: 5 },
    { name: "Human Resources", code: "HR", defaultRetentionYears: 10 },
    { name: "Finance & Accounts", code: "FIN", defaultRetentionYears: 10 },
    { name: "Procurement & Contracts", code: "PROC", defaultRetentionYears: 10 },
    { name: "Land & Planning", code: "LAND", defaultRetentionYears: 25 },
    { name: "Legal Affairs", code: "LEGAL", defaultRetentionYears: 25 },
    { name: "Public Complaints", code: "COMPLAINT", defaultRetentionYears: 5 },
    { name: "Health & Sanitation", code: "HEALTH", defaultRetentionYears: 10 },
    { name: "Education", code: "EDU", defaultRetentionYears: 10 },
    { name: "ICT & Systems", code: "ICT", defaultRetentionYears: 5 },
  ];

  for (const category of categories) {
    await prisma.fileCategory.upsert({
      where: { code: category.code },
      update: {},
      create: category,
    });
  }

  console.log("File categories seeded.");
}
