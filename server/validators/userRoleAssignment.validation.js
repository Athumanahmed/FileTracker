import { body } from "express-validator";

export const assignRoleValidationRules = [
  body("roleCode")
    .trim()
    .notEmpty()
    .withMessage("roleCode is required")
    .customSanitizer((value) => (typeof value === "string" ? value.toUpperCase() : value)),
];
