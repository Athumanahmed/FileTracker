import { AppError } from "../utils/AppError.js";
import {
  parsePagination,
  parseSort,
  buildPaginationMeta,
  buildSearchClause,
  parseBooleanFilter,
} from "../utils/queryOptions.js";
import { withWeeklyTrend } from "../utils/trendCalculator.js";
import * as userRepository from "../repositories/user.repository.js";
import * as authRepository from "../repositories/auth.repository.js";
import { resolveActorScope, assertTargetWithinScope } from "./userScope.service.js";

const SORTABLE_FIELDS = ["fullName", "username", "email", "createdAt", "lastLoginAt"];
const SEARCHABLE_FIELDS = ["firstName", "lastName", "fullName", "username", "email", "phoneNumber"];

const mapRoles = (userRoles) => userRoles.map(({ role }) => ({ id: role.id, name: role.name, code: role.code }));

const sanitizeSummary = (user) => ({
  id: user.id,
  username: user.username,
  fullName: user.fullName,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  phoneNumber: user.phoneNumber,
  profileImage: user.profileImage,
  employeeNumber: user.employeeNumber,
  status: user.status,
  isActive: user.isActive,
  mustChangePassword: user.mustChangePassword,
  lastLoginAt: user.lastLoginAt,
  createdAt: user.createdAt,
  department: user.department,
  unit: user.unit,
  position: user.position,
  roles: mapRoles(user.roles),
});

/** Flattens every held role's permissions into one deduplicated code list -- same shape /auth/me returns. */
const extractPermissionCodes = (userRoles) => {
  const codes = new Set();
  for (const { role } of userRoles) {
    for (const { permission } of role.permissions) {
      codes.add(permission.code);
    }
  }
  return [...codes];
};

const sanitizeDetail = (user) => ({
  ...sanitizeSummary(user),
  middleName: user.middleName,
  gender: user.gender,
  dateOfBirth: user.dateOfBirth,
  nationalId: user.nationalId,
  authenticationMethod: user.authenticationMethod,
  emailVerifiedAt: user.emailVerifiedAt,
  phoneVerifiedAt: user.phoneVerifiedAt,
  failedLoginAttempts: user.failedLoginAttempts,
  lockedUntil: user.lockedUntil,
  updatedAt: user.updatedAt,
  createdBy: user.createdBy,
  updatedBy: user.updatedBy,
  permissions: extractPermissionCodes(user.roles),
});

/**
 * USERS.READ is held by SYSTEM_ADMIN (GLOBAL), HOD (DEPARTMENT), and
 * SUPERVISOR (UNIT) -- same permission bit, but the roster each of them
 * can actually see is forced to their own scope here, on top of (never
 * instead of) whatever filters the request itself specified. A HOD/
 * Supervisor supplying a foreign departmentId/unitId filter just gets
 * their own scope's results anyway, exactly as if they hadn't -- no error,
 * since a stale/mismatched filter isn't a mutation attempt worth rejecting,
 * just silently constrained. Mirrors userScope.service.js's
 * resolveActorScope, the same mechanism creation already uses.
 */
const applyActorScope = async (actorId, where) => {
  const [actor, roleCodes] = await Promise.all([
    authRepository.findUserById(actorId),
    userRepository.findActiveRoleCodesForUser(actorId),
  ]);
  if (!actor) throw new AppError(404, "Actor not found");

  const { scopeType } = resolveActorScope(roleCodes);

  if (scopeType === "GLOBAL") return where;
  if (scopeType === "DEPARTMENT") return { ...where, departmentId: actor.departmentId };
  return { ...where, departmentId: actor.departmentId, unitId: actor.unitId }; // UNIT
};

const resolveActorForScopeCheck = async (actorId) => {
  const [actor, roleCodes] = await Promise.all([
    authRepository.findUserById(actorId),
    userRepository.findActiveRoleCodesForUser(actorId),
  ]);
  if (!actor) throw new AppError(404, "Actor not found");
  return { actor, ...resolveActorScope(roleCodes) };
};

export const listUsersForAdmin = async ({ query, actorId }) => {
  const { page, limit, skip, take } = parsePagination(query);
  const orderBy = parseSort(query, SORTABLE_FIELDS, "createdAt");
  const isActive = parseBooleanFilter(query.isActive);

  const baseWhere = {
    deletedAt: null,
    ...(isActive !== undefined ? { isActive } : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(query.departmentId ? { departmentId: query.departmentId } : {}),
    ...(query.unitId ? { unitId: query.unitId } : {}),
    ...(query.roleCode ? { roles: { some: { role: { code: query.roleCode } } } } : {}),
    ...buildSearchClause(query.search, SEARCHABLE_FIELDS),
  };
  const where = await applyActorScope(actorId, baseWhere);

  const [items, total] = await Promise.all([
    userRepository.findManyForAdmin({ where, orderBy, skip, take }),
    userRepository.countForAdmin(where),
  ]);

  return { items: items.map(sanitizeSummary), meta: buildPaginationMeta(total, page, limit) };
};

export const getUserByIdForAdmin = async (id, actorId) => {
  const user = await userRepository.findByIdForAdmin(id);
  if (!user) throw new AppError(404, "User not found");

  const { actingRoleCode, scopeType, actor } = await resolveActorForScopeCheck(actorId);
  assertTargetWithinScope({
    actingRoleCode,
    scopeType,
    actor,
    targetUser: { departmentId: user.department?.id ?? null, unitId: user.unit?.id ?? null },
  });

  return sanitizeDetail(user);
};

/**
 * Powers the Users directory's stat cards. `total` carries a real
 * week-over-week growth percent (see trendCalculator.js); active/inactive/
 * locked are point-in-time counts with their share of the total, not a
 * trend -- there's no meaningful "grew 5%" framing for "currently locked."
 */
export const getUserStatsForAdmin = async ({ actorId }) => {
  const baseWhere = await applyActorScope(actorId, { deletedAt: null });

  const [total, active, inactive, locked] = await Promise.all([
    withWeeklyTrend(userRepository.countForAdmin, baseWhere),
    userRepository.countForAdmin({ ...baseWhere, isActive: true, status: "ACTIVE" }),
    userRepository.countForAdmin({ ...baseWhere, isActive: false }),
    userRepository.countForAdmin({ ...baseWhere, status: "LOCKED" }),
  ]);

  const percentOf = (count) =>
    total.total > 0 ? Math.round((count / total.total) * 1000) / 10 : 0;

  return {
    total,
    active: { count: active, percent: percentOf(active) },
    inactive: { count: inactive, percent: percentOf(inactive) },
    locked: { count: locked, percent: percentOf(locked) },
  };
};
