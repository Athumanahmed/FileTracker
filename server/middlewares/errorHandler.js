import { AppError } from "../utils/AppError.js";

export const notFoundHandler = (req, res, next) => {
  next(new AppError(404, "Resource not found"));
};

/**
 * Single place all errors funnel through. Operational errors (AppError)
 * surface their own safe message; anything else is an unexpected bug --
 * it's logged in full server-side but the client only ever sees a generic
 * message. Stack traces are never sent in the response, in any environment.
 */
export const errorHandler = (err, req, res, next) => {
  const isAppError = err instanceof AppError;
  const statusCode = isAppError ? err.statusCode : 500;

  const logger = req.log || console;
  logger.error({ err, path: req.originalUrl, method: req.method }, "Request error");

  res.status(statusCode).json({
    success: false,
    message: isAppError ? err.message : "Internal server error. Please try again later.",
    ...(isAppError && err.code ? { code: err.code } : {}),
    ...(isAppError && err.errors ? { errors: err.errors } : {}),
  });
};
