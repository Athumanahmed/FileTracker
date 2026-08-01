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
 * Global, unscoped listing for the Users admin module -- unlike write
 * operations (see adminUserUpdate.service.js), reading the full roster
 * isn't bounded by the actor's own department/unit scope, only by holding
 * USERS.READ (enforced at the route).
 */
export const listUsersForAdmin = async ({ query }) => {
  const { page, limit, skip, take } = parsePagination(query);
  const orderBy = parseSort(query, SORTABLE_FIELDS, "createdAt");
  const isActive = parseBooleanFilter(query.isActive);

  const where = {
    deletedAt: null,
    ...(isActive !== undefined ? { isActive } : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(query.departmentId ? { departmentId: query.departmentId } : {}),
    ...(query.unitId ? { unitId: query.unitId } : {}),
    ...(query.roleCode ? { roles: { some: { role: { code: query.roleCode } } } } : {}),
    ...buildSearchClause(query.search, SEARCHABLE_FIELDS),
  };

  const [items, total] = await Promise.all([
    userRepository.findManyForAdmin({ where, orderBy, skip, take }),
    userRepository.countForAdmin(where),
  ]);

  return { items: items.map(sanitizeSummary), meta: buildPaginationMeta(total, page, limit) };
};

export const getUserByIdForAdmin = async (id) => {
  const user = await userRepository.findByIdForAdmin(id);
  if (!user) throw new AppError(404, "User not found");
  return sanitizeDetail(user);
};

/**
 * Powers the Users directory's stat cards. `total` carries a real
 * week-over-week growth percent (see trendCalculator.js); active/inactive/
 * locked are point-in-time counts with their share of the total, not a
 * trend -- there's no meaningful "grew 5%" framing for "currently locked."
 */
export const getUserStatsForAdmin = async () => {
  const baseWhere = { deletedAt: null };

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
