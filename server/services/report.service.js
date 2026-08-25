import * as reportRepository from "../repositories/report.repository.js";
import * as authRepository from "../repositories/auth.repository.js";
import { cached, CACHE_TTL } from "../utils/cache.js";

// "Pending" is defined as "not yet terminal" rather than an enumerated
// list of in-flight statuses -- robust to a future FileStatus value
// being added without this report silently miscounting it.
const TERMINAL_STATUSES = ["COMPLETED", "REJECTED", "ARCHIVED", "CLOSED"];
const MANAGEMENT_ROLE_CODES = ["SYSTEM_ADMIN", "DIRECTOR", "HOD", "SUPERVISOR"];

const daysBetween = (from, to) => (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24);
const round1 = (n) => Math.round(n * 10) / 10;

const average = (values) => (values.length ? round1(values.reduce((sum, v) => sum + v, 0) / values.length) : null);

const countBy = (items, keyFn) => {
  const map = new Map();
  for (const item of items) {
    const key = keyFn(item);
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return map;
};

const getActorRoleCodes = async (actorId) => {
  const actor = await authRepository.findAuthenticatedUser(actorId);
  return { actor, roleCodes: actor?.roles.map((r) => r.role.code) ?? [] };
};

/**
 * HOD sees only their own department by default (server-injected, a
 * client-supplied departmentId is ignored for them -- same
 * server-injected-scope convention userScope.service.js uses for account
 * management). SYSTEM_ADMIN/DIRECTOR/SUPERVISOR see everything unless
 * they explicitly filter.
 */
const resolveScopedDepartmentId = async ({ departmentId, actorId }) => {
  const { actor, roleCodes } = await getActorRoleCodes(actorId);
  if (roleCodes.includes("HOD") && !roleCodes.some((c) => c === "SYSTEM_ADMIN" || c === "DIRECTOR")) {
    return actor?.department?.id ?? null;
  }
  return departmentId || null;
};

/** An Officer (and nobody with a management role) only ever sees their own performance row -- everyone else may filter to anyone or see all. */
const resolveScopedUserId = async ({ userId, actorId }) => {
  const { roleCodes } = await getActorRoleCodes(actorId);
  if (!roleCodes.some((c) => MANAGEMENT_ROLE_CODES.includes(c))) return actorId;
  return userId || null;
};

export const getDashboardKpis = async ({ departmentId, actorId }) => {
  const scopedDepartmentId = await resolveScopedDepartmentId({ departmentId, actorId });

  return cached(`kpis:dashboard:${scopedDepartmentId || "all"}`, CACHE_TTL.SHORT, async () => {
    const [files, assignments] = await Promise.all([
      reportRepository.findAllForReporting(),
      reportRepository.findCurrentAssignmentsForReporting(),
    ]);

    const scopedFiles = scopedDepartmentId ? files.filter((f) => f.departmentId === scopedDepartmentId) : files;
    const scopedAssignments = scopedDepartmentId
      ? assignments.filter((a) => a.file.departmentId === scopedDepartmentId)
      : assignments;

    const pending = scopedFiles.filter((f) => !TERMINAL_STATUSES.includes(f.status)).length;
    const completed = scopedFiles.filter((f) => f.status === "COMPLETED").length;
    const overdue = scopedAssignments.filter((a) => a.dueDate && a.dueDate < new Date()).length;

    const processingDays = scopedFiles.filter((f) => f.closedAt).map((f) => daysBetween(f.createdAt, f.closedAt));

    return {
      totalFiles: scopedFiles.length,
      pending,
      completed,
      overdue,
      avgProcessingDays: average(processingDays),
      statusDistribution: [...countBy(scopedFiles, (f) => f.status)].map(([status, count]) => ({ status, count })),
    };
  });
};

export const getDepartmentPerformance = async ({ departmentId, actorId }) => {
  const scopedDepartmentId = await resolveScopedDepartmentId({ departmentId, actorId });

  return cached(`kpis:department-performance:${scopedDepartmentId || "all"}`, CACHE_TTL.LONG, async () => {
    const [files, assignments] = await Promise.all([
      reportRepository.findAllForReporting(),
      reportRepository.findCurrentAssignmentsForReporting(),
    ]);

    const scopedFiles = scopedDepartmentId ? files.filter((f) => f.departmentId === scopedDepartmentId) : files;

    const buckets = new Map();
    for (const file of scopedFiles) {
      if (!buckets.has(file.departmentId)) {
        buckets.set(file.departmentId, { department: file.department, total: 0, pending: 0, completed: 0, overdue: 0, processingDays: [] });
      }
      const bucket = buckets.get(file.departmentId);
      bucket.total += 1;
      if (!TERMINAL_STATUSES.includes(file.status)) bucket.pending += 1;
      if (file.status === "COMPLETED") bucket.completed += 1;
      if (file.closedAt) bucket.processingDays.push(daysBetween(file.createdAt, file.closedAt));
    }
    for (const assignment of assignments) {
      const bucket = buckets.get(assignment.file.departmentId);
      if (bucket && assignment.dueDate && assignment.dueDate < new Date()) bucket.overdue += 1;
    }

    return [...buckets.values()]
      .map((b) => ({
        department: b.department,
        totalFiles: b.total,
        pending: b.pending,
        completed: b.completed,
        overdue: b.overdue,
        avgProcessingDays: average(b.processingDays),
      }))
      .sort((a, b) => b.totalFiles - a.totalFiles);
  });
};

/** "Officer Performance" = current workload (pending/overdue) plus how many files they were the final handler on when it completed. */
export const getOfficerPerformance = async ({ userId, actorId }) => {
  const scopedUserId = await resolveScopedUserId({ userId, actorId });

  return cached(`kpis:officer-performance:${scopedUserId || "all"}`, CACHE_TTL.LONG, async () => {
    const assignments = await reportRepository.findCurrentAssignmentsForReporting();

    const scoped = scopedUserId ? assignments.filter((a) => a.assignedToId === scopedUserId) : assignments;

    const buckets = new Map();
    for (const assignment of scoped) {
      if (!buckets.has(assignment.assignedToId)) {
        buckets.set(assignment.assignedToId, { officer: assignment.assignedTo, currentPending: 0, currentOverdue: 0, completedAsHandler: 0 });
      }
      const bucket = buckets.get(assignment.assignedToId);
      if (assignment.file.status === "COMPLETED") bucket.completedAsHandler += 1;
      else if (!TERMINAL_STATUSES.includes(assignment.file.status)) bucket.currentPending += 1;
      if (assignment.dueDate && assignment.dueDate < new Date()) bucket.currentOverdue += 1;
    }

    return [...buckets.values()].sort((a, b) => b.completedAsHandler - a.completedAsHandler);
  });
};

export const getStatusDistribution = async ({ departmentId, actorId }) => {
  const scopedDepartmentId = await resolveScopedDepartmentId({ departmentId, actorId });
  const files = await reportRepository.findAllForReporting();
  const scoped = scopedDepartmentId ? files.filter((f) => f.departmentId === scopedDepartmentId) : files;

  return [...countBy(scoped, (f) => f.status)].map(([status, count]) => ({ status, count }));
};

/** Chart-ready time series: file registrations bucketed by day or month -- data shaped for a frontend charting library, not a rendered image. */
export const getRegistrationsOverTime = async ({ bucket = "month", dateFrom, dateTo, departmentId, actorId }) => {
  const scopedDepartmentId = await resolveScopedDepartmentId({ departmentId, actorId });
  const cacheKey = `kpis:registrations-over-time:${scopedDepartmentId || "all"}:${bucket}:${dateFrom || ""}:${dateTo || ""}`;

  return cached(cacheKey, CACHE_TTL.LONG, async () => {
    const files = await reportRepository.findAllForReporting();

    const from = dateFrom ? new Date(dateFrom) : null;
    const to = dateTo ? new Date(dateTo) : null;

    const scoped = files.filter(
      (f) =>
        (!scopedDepartmentId || f.departmentId === scopedDepartmentId) &&
        (!from || f.createdAt >= from) &&
        (!to || f.createdAt <= to),
    );

    const periodKey = (date) => (bucket === "day" ? date.toISOString().slice(0, 10) : date.toISOString().slice(0, 7));

    return [...countBy(scoped, (f) => periodKey(f.createdAt))]
      .map(([period, count]) => ({ period, count }))
      .sort((a, b) => a.period.localeCompare(b.period));
  });
};
