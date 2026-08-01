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
 * Statuses that are otherwise valid accounts but are explicitly forbidden
 * from using an active session -- surfaced as 403 (credentials are fine,
 * account state isn't) rather than 401 (credentials/session are the problem).
 */
const FORBIDDEN_ACCOUNT_STATUSES = {
  LOCKED: "Your account has been locked. Please contact your administrator.",
  DISABLED: "Your account has been disabled. Please contact your administrator.",
  SUSPENDED: "Your account has been suspended. Please contact your administrator.",
  ARCHIVED: "Your account has been archived and can no longer sign in.",
};

/**
 * While mustChangePassword is true (default password / admin-forced reset),
 * a user is authenticated but not yet allowed to use the system -- every
 * protected endpoint is blocked except the two needed to escape that state:
 * actually changing the password, and logging out.
 */
const PASSWORD_CHANGE_GATE_EXEMPT_ROUTES = [
  { method: "POST", path: "/api/v1/auth/force-change-password" },
  { method: "POST", path: "/api/v1/auth/logout" },
];

const isExemptFromPasswordChangeGate = (req) => {
  const path = req.originalUrl.split("?")[0];
  return PASSWORD_CHANGE_GATE_EXEMPT_ROUTES.some(
    (route) => route.method === req.method && route.path === path,
  );
};

/**
 * Verifies the access token, then re-validates that the session it points
 * to and the user it belongs to are still valid. A signature check alone
 * isn't enough -- it can't see a logout/revocation/status change that
 * happened after the token was issued.
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
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        // Machine-readable so the frontend's axios interceptor can silently
        // refresh and retry instead of surfacing this as a dead end -- see
        // client/src/utils/apiClient.js.
        throw new AppError(401, "Access token has expired", { code: "ACCESS_TOKEN_EXPIRED" });
      }
      throw new AppError(401, "Invalid access token");
    }

    if (decoded.type !== "access") {
      throw new AppError(401, "Invalid token type");
    }

    const session = await sessionService.getActiveSession(decoded.sessionId);
    if (!session || session.userId !== decoded.userId) {
      throw new AppError(401, "Session expired or revoked. Please log in again.");
    }

    const user = await authRepository.findUserById(decoded.userId);
    if (!user || user.deletedAt || !user.isActive) {
      throw new AppError(401, "Invalid session. Please log in again.");
    }

    const forbiddenReason = FORBIDDEN_ACCOUNT_STATUSES[user.status];
    if (forbiddenReason) {
      throw new AppError(403, forbiddenReason);
    }

    if (user.status !== "ACTIVE") {
      throw new AppError(401, "Account is not active");
    }

    if (user.mustChangePassword && !isExemptFromPasswordChangeGate(req)) {
      throw new AppError(403, "Password change required before accessing the system.", {
        code: "PASSWORD_CHANGE_REQUIRED",
      });
    }

    await sessionService.touchSession(session.id);

    // Deliberately minimal -- only the JWT identity, never the DB user object.
    req.user = { userId: user.id, username: user.username, sessionId: session.id };

    next();
  } catch (err) {
    next(err);
  }
};
