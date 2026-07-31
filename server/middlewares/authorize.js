import { AppError } from "../utils/AppError.js";
import * as authRepository from "../repositories/auth.repository.js";

/**
 * Permission-based authorization. Always queries Role -> RolePermission ->
 * Permission at request time -- permission codes are never hardcoded here
 * and never trusted from the JWT. Must run after `authenticate`.
 */
export const authorize = (permissionCode) => async (req, res, next) => {
  try {
    if (!req.user) {
      throw new AppError(401, "Authentication required");
    }

    const hasPermission = await authRepository.userHasPermission(
      req.user.userId,
      permissionCode,
    );

    if (!hasPermission) {
      throw new AppError(403, "You do not have permission to perform this action");
    }

    next();
  } catch (err) {
    next(err);
  }
};
