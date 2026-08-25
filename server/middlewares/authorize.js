import { AppError } from "../utils/AppError.js";
import * as authRepository from "../repositories/auth.repository.js";
import * as permissionCacheRepository from "../repositories/permissionCache.repository.js";

/**
 * Permission-based authorization. Always resolves back to Role ->
 * RolePermission -> Permission -- permission codes are never hardcoded
 * here and never trusted from the JWT. Must run after `authenticate`.
 *
 * The resolved set is cached in Redis per user (see
 * repositories/permissionCache.repository.js) rather than queried fresh
 * on every single gated request -- a user's permissions rarely change
 * mid-session, so this turns most requests into a Redis read instead of a
 * live Postgres join. A cache miss (including "Redis is unavailable
 * right now") transparently falls through to the real query; correctness
 * never depends on the cache being up.
 */
export const authorize = (permissionCode) => async (req, res, next) => {
  try {
    if (!req.user) {
      throw new AppError(401, "Authentication required");
    }

    let permissionCodes = await permissionCacheRepository.getCachedPermissionCodes(req.user.userId);
    if (permissionCodes === null) {
      permissionCodes = await authRepository.findPermissionCodesForUser(req.user.userId);
      await permissionCacheRepository.setCachedPermissionCodes(req.user.userId, permissionCodes);
    }

    if (!permissionCodes.includes(permissionCode)) {
      throw new AppError(403, "You do not have permission to perform this action");
    }

    next();
  } catch (err) {
    next(err);
  }
};
