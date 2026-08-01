import * as dashboardRepository from "../repositories/dashboard.repository.js";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * "Grew by X% from last week" -- computed from createdAt only (no historical
 * snapshot table exists), so it reflects growth, not net change: a module
 * that also loses records (e.g. soft-deleted users) would still show 0%
 * rather than negative. That matches every entity here well enough --
 * organizational structure and the user roster both grow far more often
 * than they shrink -- without claiming precision the data can't back up.
 */
const withWeeklyTrend = async (countFn, baseWhere) => {
  const since = new Date(Date.now() - SEVEN_DAYS_MS);

  const [total, createdThisWeek] = await Promise.all([
    countFn(baseWhere),
    countFn({ ...baseWhere, createdAt: { gte: since } }),
  ]);

  const totalBeforeThisWeek = total - createdThisWeek;
  const changePercent =
    totalBeforeThisWeek > 0
      ? Math.round((createdThisWeek / totalBeforeThisWeek) * 100)
      : createdThisWeek > 0
        ? 100
        : 0;

  return { total, changePercent };
};

export const getAdminSummary = async () => {
  const activeUserWhere = { deletedAt: null };

  const [users, departments, units, positions, roles, permissions, inactiveUsers] = await Promise.all([
    withWeeklyTrend(dashboardRepository.countUsers, activeUserWhere),
    withWeeklyTrend(dashboardRepository.countDepartments, { isActive: true }),
    withWeeklyTrend(dashboardRepository.countUnits, { isActive: true }),
    withWeeklyTrend(dashboardRepository.countPositions, { isActive: true }),
    withWeeklyTrend(dashboardRepository.countRoles, { isActive: true }),
    withWeeklyTrend(dashboardRepository.countPermissions, { isActive: true }),
    dashboardRepository.countUsers({ ...activeUserWhere, isActive: false }),
  ]);

  return {
    stats: { users, departments, units, positions, roles, permissions },
    alerts: { inactiveUsers },
  };
};

/**
 * Every CRUD module logs `description: "${action} (${entityId})"` at write
 * time (see e.g. department.service.js) -- fine for an audit trail, not
 * readable in a UI feed. Reformatted here, at read time, from action +
 * metadata.after rather than touching how every module already logs.
 */
const ENTITY_LABELS = {
  User: "user",
  Department: "department",
  Unit: "unit",
  Position: "position",
  Role: "role",
  Permission: "permission",
};

/**
 * Only Department/Unit/Position/Role/Permission CRUD log this exact
 * placeholder at write time (see e.g. department.service.js's logAudit).
 * Everything else -- user creation, admin updates, role-permission
 * assignment, login/logout -- already writes a readable sentence, which
 * is used as-is rather than risking a worse synthesized one.
 */
const isGenericDescription = (log) => log.description === `${log.action} (${log.entityId})`;

const capitalize = (word) => `${word[0].toUpperCase()}${word.slice(1)}`;

const humanize = (log) => {
  if (log.description && !isGenericDescription(log)) {
    return log.description;
  }

  const label = ENTITY_LABELS[log.entity] || log.entity.toLowerCase();
  const name = log.metadata?.after?.name || log.metadata?.after?.title || log.metadata?.after?.code;

  if (log.action.endsWith("_CREATED")) {
    return name ? `New ${label} "${name}" was created` : `A new ${label} was created`;
  }
  if (log.action.endsWith("_UPDATED")) {
    return name ? `${capitalize(label)} "${name}" was updated` : `A ${label} was updated`;
  }
  if (log.action.endsWith("_DEACTIVATED")) {
    return name ? `${capitalize(label)} "${name}" was deactivated` : `A ${label} was deactivated`;
  }
  if (log.action.endsWith("_REACTIVATED")) {
    return name ? `${capitalize(label)} "${name}" was reactivated` : `A ${label} was reactivated`;
  }

  return log.description || log.action;
};

export const getRecentActivity = async (limit) => {
  const logs = await dashboardRepository.findRecentAuditLogs(limit);

  return logs.map((log) => ({
    id: log.id,
    action: log.action,
    entity: log.entity,
    description: humanize(log),
    performedBy: log.user?.fullName || log.user?.username || "System",
    createdAt: log.createdAt,
  }));
};
