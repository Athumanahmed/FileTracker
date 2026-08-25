import { query } from "express-validator";

export const globalSearchValidationRules = [
  query("q")
    .trim()
    .notEmpty()
    .withMessage("q is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("q must be between 2 and 100 characters"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 25 })
    .withMessage("limit must be an integer between 1 and 25")
    .toInt(),
];
