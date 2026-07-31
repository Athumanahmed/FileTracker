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
    // Machine-readable discriminator for cases where the client needs to
    // branch on failure reason (e.g. "PASSWORD_CHANGE_REQUIRED") without
    // parsing the human-readable `message`.
    this.code = options.code || null;
    Error.captureStackTrace(this, this.constructor);
  }
}
