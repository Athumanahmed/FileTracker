import { body } from "express-validator";
import { normalizePhoneNumber } from "../services/phone.service.js";

const nullableIdRule = (field) =>
  body(field)
    .optional()
    .custom((value) => value === null || (typeof value === "string" && value.trim().length > 0))
    .withMessage(`${field} must be a non-empty string, or null to clear it`);

/**
 * departmentId/unitId/positionId are optional and may be explicitly null
 * (to clear an assignment) -- express-validator's default optional()
 * still validates a present `null`, which is exactly what's wanted here;
 * only a genuinely absent field is skipped. Whether a given actor is
 * actually allowed to change any of these is a scope decision made in
 * adminUserUpdate.service.js, not here.
 */
export const updateUserByAdminValidationRules = [
  nullableIdRule("departmentId"),
  nullableIdRule("unitId"),
  nullableIdRule("positionId"),
  body("email")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Email cannot be empty")
    .isEmail()
    .withMessage("Enter a valid email address")
    .normalizeEmail(),
  body("phoneNumber")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Phone number cannot be empty")
    .custom((value) => {
      normalizePhoneNumber(value);
      return true;
    })
    .withMessage("Enter a valid Tanzanian phone number (e.g. 0712345678)"),
  body("profileImage").optional({ checkFalsy: true }).trim().isLength({ max: 1000 }),
];
