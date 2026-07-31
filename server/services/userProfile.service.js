import { AppError } from "../utils/AppError.js";
import { AUDIT_ACTIONS } from "../utils/auditActions.js";
import { normalizePhoneNumber } from "./phone.service.js";
import * as authRepository from "../repositories/auth.repository.js";
import * as userRepository from "../repositories/user.repository.js";

/** Strict allowlist -- never echoes passwordHash or any other sensitive column. */
const sanitize = (user) => ({
  id: user.id,
  username: user.username,
  firstName: user.firstName,
  middleName: user.middleName,
  lastName: user.lastName,
  fullName: user.fullName,
  email: user.email,
  phoneNumber: user.phoneNumber,
  profileImage: user.profileImage,
  updatedAt: user.updatedAt,
});

/** Allowlisted snapshot for audit before/after. */
const snapshot = (user) => ({
  firstName: user.firstName,
  middleName: user.middleName,
  lastName: user.lastName,
  email: user.email,
  phoneNumber: user.phoneNumber,
  profileImage: user.profileImage,
});

/**
 * Self-service profile update. Only the fields listed here are ever
 * touched -- username, employeeNumber, nationalId, roles, department,
 * unit, position, password, status, and authenticationMethod are simply
 * never read from the payload, no matter what the client sends. Those
 * changes go through their own dedicated modules (admin update, account
 * management, force-change-password), each with its own authorization.
 */
export const updateOwnProfile = async ({ userId, payload, ipAddress }) => {
  const existing = await userRepository.findById(userId);
  if (!existing || existing.deletedAt) {
    throw new AppError(404, "User not found");
  }

  const phoneNumber =
    payload.phoneNumber !== undefined ? normalizePhoneNumber(payload.phoneNumber) : existing.phoneNumber;

  if (payload.email && payload.email !== existing.email) {
    const conflict = await userRepository.findUserByEmail(payload.email);
    if (conflict) throw new AppError(409, "Email is already registered");
  }
  if (phoneNumber !== existing.phoneNumber) {
    const conflict = await userRepository.findUserByPhoneNumber(phoneNumber);
    if (conflict) throw new AppError(409, "Phone number is already registered");
  }

  const firstName = payload.firstName ?? existing.firstName;
  const middleName = payload.middleName !== undefined ? payload.middleName || null : existing.middleName;
  const lastName = payload.lastName ?? existing.lastName;

  let updated;
  try {
    updated = await userRepository.update(userId, {
      firstName,
      middleName,
      lastName,
      fullName: [firstName, middleName, lastName].filter(Boolean).join(" "),
      email: payload.email ?? existing.email,
      phoneNumber,
      profileImage: payload.profileImage !== undefined ? payload.profileImage || null : existing.profileImage,
    });
  } catch (err) {
    if (err.code === "P2002") {
      throw new AppError(409, `An account with this ${err.meta?.target?.[0] || "value"} already exists`);
    }
    throw err;
  }

  await authRepository.createAuditLog({
    userId,
    action: AUDIT_ACTIONS.USER_PROFILE_UPDATED,
    entity: "User",
    entityId: userId,
    description: "User updated their own profile",
    metadata: { before: snapshot(existing), after: snapshot(updated) },
    ipAddress,
  });

  return sanitize(updated);
};
