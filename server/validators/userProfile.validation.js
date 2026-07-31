import { body } from "express-validator";
import { normalizePhoneNumber } from "../services/phone.service.js";

/**
 * Every field is optional (partial update) -- but the set itself is a
 * closed allowlist. username/employeeNumber/nationalId/roles/department/
 * unit/position/password/status/authenticationMethod are deliberately
 * absent: express-validator only strips/validates what's declared here,
 * and the service only ever reads these same field names from the body.
 */
export const updateOwnProfileValidationRules = [
  body("firstName").optional().trim().notEmpty().withMessage("First name cannot be empty").isLength({ max: 100 }),
  body("middleName").optional({ checkFalsy: true }).trim().isLength({ max: 100 }),
  body("lastName").optional().trim().notEmpty().withMessage("Last name cannot be empty").isLength({ max: 100 }),
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
