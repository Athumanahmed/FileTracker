import { AppError } from "../utils/AppError.js";
import { verifyAccessToken } from "../services/jwt.service.js";
import * as authRepository from "../repositories/auth.repository.js";
import * as sessionService from "../services/session.service.js";

const extractBearerToken = (req) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) return null;
  return header.slice(7).trim();
};

/**
 * Verifies the access token, then re-validates that the session it points
 * to and the user it belongs to are still valid. A signature check alone
 * isn't enough -- it can't see a logout/revocation that happened after the
 * token was issued.
 */
export const authenticate = async (req, res, next) => {
  try {
    const token = extractBearerToken(req);
    if (!token) {
      throw new AppError(401, "Authentication required");
    }

    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch {
      throw new AppError(401, "Invalid or expired access token");
    }

    if (decoded.type !== "access") {
      throw new AppError(401, "Invalid token type");
    }

    const session = await sessionService.getActiveSession(decoded.sessionId);
    if (!session) {
      throw new AppError(401, "Session expired or revoked. Please log in again.");
    }

    const user = await authRepository.findUserById(decoded.userId);
    if (!user || !user.isActive || user.status !== "ACTIVE") {
      throw new AppError(401, "Account is no longer active");
    }

    await sessionService.touchSession(session.id);

    // Deliberately minimal -- no roles/permissions attached here.
    req.user = { id: user.id, username: user.username, sessionId: session.id };

    next();
  } catch (err) {
    next(err);
  }
};
