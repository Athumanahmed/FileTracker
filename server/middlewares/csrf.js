import { AppError } from "../utils/AppError.js";
import { securityConfig } from "../config/security.js";

const CSRF_HEADER_NAME = "x-csrf-token";

/**
 * Double-submit-cookie CSRF check. Only needed on endpoints authenticated
 * purely via an ambient httpOnly cookie (i.e. /refresh) -- routes that
 * require a Bearer access token in the Authorization header (e.g. /logout)
 * aren't vulnerable to CSRF the same way, since a cross-site form can't
 * set that header.
 *
 * The csrf cookie is readable by client JS (not httpOnly) so the SPA can
 * read it and echo it back as a header; an attacker's cross-origin page
 * can't read it due to the same-origin policy, so it can't forge a
 * matching header even though the browser will still attach the cookie.
 */
export const verifyCsrfToken = (req, res, next) => {
  const cookieToken = req.cookies?.[securityConfig.csrfCookieName];
  const headerToken = req.headers[CSRF_HEADER_NAME];

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return next(new AppError(403, "Invalid or missing CSRF token"));
  }

  next();
};
