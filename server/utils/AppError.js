/**
 * An operational, expected error safe to surface to the client
 * (e.g. "Invalid username or password", "Validation failed").
 * Anything thrown that is NOT an AppError is treated as an unexpected
 * 500 by the central error handler and never has its message exposed.
 */
export class AppError extends Error {
  constructor(statusCode, message, options = {}) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.isOperational = true;
    this.errors = options.errors || null;
    Error.captureStackTrace(this, this.constructor);
  }
}
