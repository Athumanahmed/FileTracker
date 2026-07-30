import "dotenv/config";
import prisma from "../config/prisma.js";
import { seedPermissions } from "./seeds/seedPermissions.js";
import { seedRoles } from "./seeds/seedRoles.js";
import { seedRolePermissions } from "./seeds/seedRolePermissions.js";
import { seedDepartments } from "./seeds/seedDepartments.js";
import { seedUnits } from "./seeds/seedUnits.js";
import { seedPositions } from "./seeds/seedPositions.js";
import { seedAdmin } from "./seeds/seedAdmin.js";

async function main() {
  // seeders
  console.log("=================================");
  console.log("Starting Database Seeding...");
  console.log("=================================\n");

  await seedPermissions(prisma);
  await seedRoles(prisma);
  await seedRolePermissions(prisma);

  await seedDepartments(prisma);
  await seedUnits(prisma);
  await seedPositions(prisma);

  await seedAdmin(prisma);

  console.log("\n=================================");
  console.log("Database Seeding Completed");
  console.log("=================================");
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("Seeding complete.");
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
