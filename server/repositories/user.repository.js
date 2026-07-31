import prisma from "../config/prisma.js";

/**
 * Data-access layer for the (future, general) Users module. Distinct from
 * auth.repository.js, which is scoped to the auth/session/password domain
 * -- this one owns account provisioning.
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
