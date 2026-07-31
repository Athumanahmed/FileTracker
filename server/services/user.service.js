import { AppError } from "../utils/AppError.js";
import { AUDIT_ACTIONS } from "../utils/auditActions.js";
import { normalizePhoneNumber } from "./phone.service.js";
import { hashPassword } from "./password.service.js";
import { generateDefaultPassword } from "../utils/generatePassword.js";
import * as authRepository from "../repositories/auth.repository.js";
import * as userRepository from "../repositories/user.repository.js";
import * as userScopeService from "./userScope.service.js";

/** Strict allowlist -- the created user's own record is never returned wholesale. */
const sanitizeCreatedUser = (user) => ({
  id: user.id,
  username: user.username,
  fullName: user.fullName,
  email: user.email,
  phoneNumber: user.phoneNumber,
  status: user.status,
  departmentId: user.departmentId,
  unitId: user.unitId,
  positionId: user.positionId,
  mustChangePassword: user.mustChangePassword,
  createdAt: user.createdAt,
});

const assertCreatorEligible = (creator) => {
  if (!creator || creator.deletedAt || !creator.isActive || creator.status !== "ACTIVE") {
    throw new AppError(403, "Your account is not eligible to create users");
  }
};

const assertUnique = async (payload) => {
  const [existingUsername, existingEmail, existingPhone] = await Promise.all([
    userRepository.findUserByUsername(payload.username),
    userRepository.findUserByEmail(payload.email),
    userRepository.findUserByPhoneNumber(payload.phoneNumber),
  ]);

  if (existingUsername) throw new AppError(409, "Username is already taken");
  if (existingEmail) throw new AppError(409, "Email is already registered");
  if (existingPhone) throw new AppError(409, "Phone number is already registered");
};

/**
 * Validates a client-supplied positionId against the scope already
 * resolved for this user: the position must exist, be active, and belong
 * to the assigned unit/department (a position is always attached to a
 * unit in the schema, so a mismatch here would otherwise silently create
 * a user whose position and unit/department disagree).
 */
const resolvePositionId = async (positionId, { departmentId, unitId }) => {
  if (!positionId) return null;

  const position = await userRepository.findPositionById(positionId);

  const belongsToUnit = !unitId || position?.unitId === unitId;
  const belongsToDepartment = !departmentId || position?.unit?.departmentId === departmentId;

  if (!position || !position.isActive || !belongsToUnit || !belongsToDepartment) {
    throw new AppError(
      422,
      "Selected position does not exist, is inactive, or does not belong to the assigned department/unit",
    );
  }

  return position.id;
};

/**
 * Creates a subordinate account under the organizational administration
 * hierarchy (see config/organizationalHierarchy.js). Identity and scope
 * both come from re-checking the creator's own DB record -- never from
 * client-supplied departmentId/unitId/roleId for scope-constrained roles.
 */
export const createUser = async ({ creatorUserId, targetRoleCode, payload, ipAddress }) => {
  const creator = await authRepository.findUserById(creatorUserId);
  assertCreatorEligible(creator);

  const creatorRoleCodes = await userRepository.findActiveRoleCodesForUser(creator.id);
  const actingRoleCode = userScopeService.resolveActingRole(creatorRoleCodes, targetRoleCode);

  const { departmentId, unitId } = await userScopeService.resolveCreationScope({
    creator,
    actingRoleCode,
    targetRoleCode,
    requestedDepartmentId: payload.departmentId || null,
    requestedUnitId: payload.unitId || null,
  });

  const positionId = await resolvePositionId(payload.positionId, { departmentId, unitId });

  const targetRole = await userRepository.findRoleByCode(targetRoleCode);
  if (!targetRole || !targetRole.isActive) {
    throw new AppError(500, "Target role is not configured");
  }

  const phoneNumber = normalizePhoneNumber(payload.phoneNumber);
  await assertUnique({ username: payload.username, email: payload.email, phoneNumber });

  const defaultPassword = generateDefaultPassword();
  const passwordHash = await hashPassword(defaultPassword);

  let user;
  try {
    user = await userRepository.createUserWithRole({
      userData: {
        firstName: payload.firstName,
        middleName: payload.middleName || null,
        lastName: payload.lastName,
        fullName: `${payload.firstName} ${payload.lastName}`.trim(),
        gender: payload.gender || null,
        phoneNumber,
        email: payload.email,
        username: payload.username,
        passwordHash,
        mustChangePassword: true,
        status: "ACTIVE",
        isActive: true,
        departmentId,
        unitId,
        positionId,
        createdById: creator.id,
      },
      roleId: targetRole.id,
    });
  } catch (err) {
    // Safety net for the (rare) race between the uniqueness pre-check
    // above and this insert -- two near-simultaneous requests could both
    // pass assertUnique before either commits.
    if (err.code === "P2002") {
      throw new AppError(409, `An account with this ${err.meta?.target?.[0] || "field"} already exists`);
    }
    throw err;
  }

  await authRepository.createAuditLog({
    userId: creator.id,
    action: AUDIT_ACTIONS.USER_CREATED,
    entity: "User",
    entityId: user.id,
    description: `Created ${targetRoleCode} account for ${user.username}`,
    ipAddress,
  });

  return {
    user: sanitizeCreatedUser(user),
    // Shown exactly once -- never persisted in plaintext, never logged again.
    defaultPassword,
  };
};
