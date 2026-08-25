import { AppError } from "../utils/AppError.js";
import * as dashboardRepository from "../repositories/dashboard.repository.js";
import * as authRepository from "../repositories/auth.repository.js";
import { resolveActorScope } from "./userScope.service.js";
import { withWeeklyTrend } from "../utils/trendCalculator.js";
import { parsePagination, buildPaginationMeta } from "../utils/queryOptions.js";
import { cached, CACHE_TTL } from "../utils/cache.js";

// Global -- identical for every SYSTEM_ADMIN caller (no per-actor scoping
// like report.service.js's KPIs have), so one shared key is both correct
// and more cache-efficient than keying by actorId.
export const getAdminSummary = () =>
  cached("kpis:admin-summary", CACHE_TTL.SHORT, async () => {
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
  });

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

// Global (same feed for every admin), keyed by limit since a caller
// requesting a longer/shorter feed shouldn't get a truncated/padded
// cached result meant for a different limit.
export const getRecentActivity = (limit) =>
  cached(`kpis:recent-activity:${limit}`, CACHE_TTL.SHORT, async () => {
    const logs = await dashboardRepository.findRecentAuditLogs(limit);

    return logs.map((log) => ({
      id: log.id,
      action: log.action,
      entity: log.entity,
      description: humanize(log),
      performedBy: log.user?.fullName || log.user?.username || "System",
      createdAt: log.createdAt,
    }));
  });

/**
 * Builds the AuditLog.findMany `where` for the full Audit Logs page --
 * unlike getRecentActivity's fixed-size feed, this is a real filterable/
 * searchable listing. `search` deliberately reaches across description,
 * action, entity, AND the related user's name/username in one OR clause
 * (queryOptions.js's buildSearchClause only handles flat fields on the
 * model itself, not a relation, so this is hand-rolled instead of reused).
 */
const buildAuditLogWhere = (query) => {
  const where = {};

  if (query.entity) where.entity = query.entity;
  if (query.dateFrom || query.dateTo) {
    where.createdAt = {};
    if (query.dateFrom) where.createdAt.gte = new Date(query.dateFrom);
    if (query.dateTo) where.createdAt.lte = new Date(query.dateTo);
  }
  if (query.search) {
    where.OR = [
      { description: { contains: query.search, mode: "insensitive" } },
      { action: { contains: query.search, mode: "insensitive" } },
      { entity: { contains: query.search, mode: "insensitive" } },
      { user: { fullName: { contains: query.search, mode: "insensitive" } } },
      { user: { username: { contains: query.search, mode: "insensitive" } } },
    ];
  }

  return where;
};

/** Full, paginated Audit Logs page -- richer per-row detail (entityId, ipAddress, metadata, structured performedBy) than the dashboard widget's flattened feed, since this is the "drill into what actually happened" surface. */
export const listAuditLogsForAdmin = async (query) => {
  const { page, limit, skip, take } = parsePagination(query);
  const sortOrder = query.sortOrder === "asc" ? "asc" : "desc";
  const where = buildAuditLogWhere(query);

  const [logs, total] = await Promise.all([
    dashboardRepository.findAuditLogs({ where, orderBy: { createdAt: sortOrder }, skip, take }),
    dashboardRepository.countAuditLogs(where),
  ]);

  const items = logs.map((log) => ({
    id: log.id,
    action: log.action,
    entity: log.entity,
    entityId: log.entityId,
    description: humanize(log),
    performedBy: log.user ? { id: log.user.id, fullName: log.user.fullName, username: log.user.username } : null,
    ipAddress: log.ipAddress,
    metadata: log.metadata,
    createdAt: log.createdAt,
  }));

  return { items, meta: buildPaginationMeta(total, page, limit) };
};

export const getAuditLogEntityOptions = () => dashboardRepository.findDistinctAuditEntities();

const SUBORDINATE_ROLE_BY_SCOPE = { DEPARTMENT: "SUPERVISOR", UNIT: "OFFICER" };
const SUBORDINATE_LABEL_BY_SCOPE = { DEPARTMENT: "Supervisors", UNIT: "Officers" };

/**
 * The HOD/Supervisor dashboard's summary -- shape adapts to the actor's
 * own scope (DEPARTMENT for HOD, UNIT for Supervisor) rather than being
 * two near-identical endpoints. Unlike getAdminSummary, there's no
 * Roles/Permissions/Departments-wide breakdown here -- those concepts
 * don't scope to a single department/unit -- just the people and (for a
 * department) units actually within the actor's own reach.
 */
// Keyed by actorId, not the resolved department/unit -- simpler (no need
// to resolve scope before even checking the cache) at the minor cost of
// not sharing one cache entry across two peers in the same department/unit.
export const getScopedSummary = (actorId) =>
  cached(`kpis:scoped-summary:${actorId}`, CACHE_TTL.SHORT, async () => {
    const actor = await authRepository.findAuthenticatedUser(actorId);
    if (!actor) throw new AppError(404, "User not found");

    const roleCodes = actor.roles.map((userRole) => userRole.role.code);
    const { scopeType } = resolveActorScope(roleCodes);

    if (scopeType !== "DEPARTMENT" && scopeType !== "UNIT") {
      throw new AppError(403, "Your role has no scoped dashboard to view");
    }

    const departmentId = actor.department?.id ?? null;
    const unitId = scopeType === "UNIT" ? (actor.unit?.id ?? null) : null;
    const activeUserWhere = { deletedAt: null, departmentId, ...(unitId ? { unitId } : {}) };

    const [users, activeCount, inactiveCount, unitsCount, subordinateCount] = await Promise.all([
      withWeeklyTrend(dashboardRepository.countUsers, activeUserWhere),
      dashboardRepository.countUsers({ ...activeUserWhere, isActive: true }),
      dashboardRepository.countUsers({ ...activeUserWhere, isActive: false }),
      scopeType === "DEPARTMENT" ? dashboardRepository.countUnits({ isActive: true, departmentId }) : Promise.resolve(null),
      dashboardRepository.countUsersByRole({
        departmentId,
        unitId,
        roleCode: SUBORDINATE_ROLE_BY_SCOPE[scopeType],
      }),
    ]);

    const percentOf = (count) => (users.total > 0 ? Math.round((count / users.total) * 1000) / 10 : 0);

    return {
      scope: {
        type: scopeType,
        name: (scopeType === "DEPARTMENT" ? actor.department?.name : actor.unit?.name) ?? null,
      },
      users: {
        total: users,
        active: { count: activeCount, percent: percentOf(activeCount) },
        inactive: { count: inactiveCount, percent: percentOf(inactiveCount) },
      },
      unitsCount,
      subordinates: { label: SUBORDINATE_LABEL_BY_SCOPE[scopeType], count: subordinateCount },
    };
  });

/** The actor's own recent actions (not their whole department/unit's) -- see dashboard.repository.js#findRecentAuditLogsByUser. */
export const getScopedRecentActivity = (actorId, limit) =>
  cached(`kpis:scoped-recent-activity:${actorId}:${limit}`, CACHE_TTL.SHORT, async () => {
    const logs = await dashboardRepository.findRecentAuditLogsByUser(actorId, limit);

    return logs.map((log) => ({
      id: log.id,
      action: log.action,
      entity: log.entity,
      description: humanize(log),
      performedBy: log.user?.fullName || log.user?.username || "System",
      createdAt: log.createdAt,
    }));
  });
