import prisma from "../config/prisma.js";

/** Read-only in this phase -- category management (create/update/deactivate) is a Future Improvement. */

export const findById = (id) => prisma.fileCategory.findFirst({ where: { id, isActive: true } });

export const findMany = (where = {}) =>
  prisma.fileCategory.findMany({ where: { isActive: true, ...where }, orderBy: { name: "asc" } });
