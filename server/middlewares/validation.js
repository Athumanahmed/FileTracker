import { validationResult } from "express-validator";
import { AppError } from "../utils/AppError.js";

/**
 * Runs after an express-validator rule chain. Turns validation failures
 * into a single, consistently-shaped 422 instead of leaking express-validator's
 * internal error format.
 */
export const validateRequest = (req, res, next) => {
  const result = validationResult(req);

  if (result.isEmpty()) {
    return next();
  }

  const errors = result.array({ onlyFirstError: true }).map((error) => ({
    field: error.path,
    message: error.msg,
  }));

  next(new AppError(422, "Validation failed", { errors }));
};
