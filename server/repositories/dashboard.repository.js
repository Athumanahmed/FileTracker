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

/** Users holding a given role, optionally further scoped to a department/unit -- e.g. "Supervisors in my department". */
export const countUsersByRole = ({ departmentId, unitId, roleCode }) =>
  prisma.user.count({
    where: {
      deletedAt: null,
      ...(departmentId ? { departmentId } : {}),
      ...(unitId ? { unitId } : {}),
      roles: { some: { role: { code: roleCode } } },
    },
  });

/** Powers the HOD/Supervisor scoped dashboard's "recent activity" -- the actor's own recent actions, not their whole department's. */
export const findRecentAuditLogsByUser = (userId, take) =>
  prisma.auditLog.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take,
    include: {
      user: { select: { fullName: true, username: true } },
    },
  });
