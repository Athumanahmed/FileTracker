import prisma from "../config/prisma.js";

/** Data-access layer for the System Admin dashboard -- read-only aggregates across modules. */

export const countUsers = (where) => prisma.user.count({ where });
export const countDepartments = (where) => prisma.department.count({ where });
export const countUnits = (where) => prisma.unit.count({ where });
export const countPositions = (where) => prisma.position.count({ where });
export const countRoles = (where) => prisma.role.count({ where });
export const countPermissions = (where) => prisma.permission.count({ where });

export const findRecentAuditLogs = (take) =>
  prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take,
    include: {
      user: { select: { fullName: true, username: true } },
    },
  });
