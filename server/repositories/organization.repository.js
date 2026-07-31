import prisma from "../config/prisma.js";

/**
 * Data-access layer for Department/Unit lookups used by the user-creation
 * scope resolver. Read-only -- department/unit management itself is a
 * separate module.
 */

export const findDepartmentById = (id) => prisma.department.findUnique({ where: { id } });

export const findUnitById = (id) => prisma.unit.findUnique({ where: { id } });
