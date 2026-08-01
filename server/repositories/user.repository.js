import prisma from "../config/prisma.js";
import { revokeAllSessionsAndTokens } from "./password.repository.js";

/**
 * Data-access layer for the (future, general) Users module. Distinct from
 * auth.repository.js, which is scoped to the auth/session/password domain
 * -- this one owns account provisioning, profile/admin updates, and
 * account-management actions.
 */

export const findRoleByCode = (code) => prisma.role.findUnique({ where: { code } });

/** Active roles held by a user, as plain role codes -- used to resolve creation authority. */
export const findActiveRoleCodesForUser = async (userId) => {
  const userRoles = await prisma.userRole.findMany({
    where: { userId, role: { isActive: true } },
    include: { role: true },
  });

  return userRoles.map((userRole) => userRole.role.code);
};

export const findUserByUsername = (username) => prisma.user.findUnique({ where: { username } });

export const findUserByEmail = (email) => prisma.user.findUnique({ where: { email } });

export const findUserByPhoneNumber = (phoneNumber) =>
  prisma.user.findUnique({ where: { phoneNumber } });

/** Includes the owning unit so callers can cross-check unit/department consistency. */
export const findPositionById = (id) =>
  prisma.position.findUnique({ where: { id }, include: { unit: true } });

/** Creates the user and assigns their single administrative role atomically. */
export const createUserWithRole = ({ userData, roleId }) =>
  prisma.$transaction(async (tx) => {
    const user = await tx.user.create({ data: userData });
    await tx.userRole.create({ data: { userId: user.id, roleId } });
    return user;
  });

// ---------------------------------------------------------------------------
// Profile / Admin update
// ---------------------------------------------------------------------------

export const findById = (id) => prisma.user.findUnique({ where: { id } });

/** Plain field update -- no session/status side effects. Used by both self-profile and admin update. */
export const update = (id, data) => prisma.user.update({ where: { id }, data });

// ---------------------------------------------------------------------------
// Account status management
// ---------------------------------------------------------------------------

/**
 * Deactivation also kills every live session/refresh token -- a
 * deactivated account shouldn't stay logged in on a device it was already
 * signed into. Atomic so a failure mid-way never leaves isActive:false
 * with sessions still alive, or vice versa.
 */
export const deactivateWithSessionRevocation = (userId, updatedById) =>
  prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id: userId },
      data: { isActive: false, updatedById },
    });
    await revokeAllSessionsAndTokens(tx, userId);
    return user;
  });

export const activate = (userId, updatedById) =>
  prisma.user.update({ where: { id: userId }, data: { isActive: true, updatedById } });

/** Same reasoning as deactivate -- a freshly-locked account shouldn't keep an existing session alive. */
export const lockWithSessionRevocation = (userId, updatedById) =>
  prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id: userId },
      data: { status: "LOCKED", updatedById },
    });
    await revokeAllSessionsAndTokens(tx, userId);
    return user;
  });

/** Clears both lock mechanisms at once -- the admin-set status AND any lingering brute-force lockedUntil/failedLoginAttempts. */
export const unlock = (userId, updatedById) =>
  prisma.user.update({
    where: { id: userId },
    data: { status: "ACTIVE", lockedUntil: null, failedLoginAttempts: 0, updatedById },
  });

// ---------------------------------------------------------------------------
// Role assignment
// ---------------------------------------------------------------------------

export const findUserRole = (userId, roleId) =>
  prisma.userRole.findUnique({ where: { userId_roleId: { userId, roleId } } });

export const countActiveRolesForUser = (userId) =>
  prisma.userRole.count({ where: { userId, role: { isActive: true } } });

export const assignRole = (userId, roleId) => prisma.userRole.create({ data: { userId, roleId } });

export const removeRole = (userId, roleId) =>
  prisma.userRole.delete({ where: { userId_roleId: { userId, roleId } } });

// ---------------------------------------------------------------------------
// Admin listing / detail -- global, unscoped view for the Users admin module.
// ---------------------------------------------------------------------------

/** Shared across the list and detail queries so both stay consistent as fields are added. */
const USER_SUMMARY_SELECT = {
  id: true,
  username: true,
  fullName: true,
  firstName: true,
  lastName: true,
  email: true,
  phoneNumber: true,
  profileImage: true,
  status: true,
  isActive: true,
  mustChangePassword: true,
  lastLoginAt: true,
  createdAt: true,
  department: { select: { id: true, name: true, code: true } },
  unit: { select: { id: true, name: true, code: true } },
  position: { select: { id: true, title: true, code: true } },
  roles: {
    where: { role: { isActive: true } },
    select: { role: { select: { id: true, name: true, code: true } } },
  },
};

export const findManyForAdmin = ({ where, orderBy, skip, take }) =>
  prisma.user.findMany({ where, orderBy, skip, take, select: USER_SUMMARY_SELECT });

export const countForAdmin = (where) => prisma.user.count({ where });

export const findByIdForAdmin = (id) =>
  prisma.user.findFirst({
    where: { id, deletedAt: null },
    select: {
      ...USER_SUMMARY_SELECT,
      middleName: true,
      gender: true,
      dateOfBirth: true,
      nationalId: true,
      employeeNumber: true,
      authenticationMethod: true,
      emailVerifiedAt: true,
      phoneVerifiedAt: true,
      failedLoginAttempts: true,
      lockedUntil: true,
      updatedAt: true,
      roles: {
        where: { role: { isActive: true } },
        select: {
          role: {
            select: {
              id: true,
              name: true,
              code: true,
              permissions: {
                where: { permission: { isActive: true } },
                select: { permission: { select: { code: true } } },
              },
            },
          },
        },
      },
      createdBy: { select: { id: true, fullName: true, username: true } },
      updatedBy: { select: { id: true, fullName: true, username: true } },
    },
  });
