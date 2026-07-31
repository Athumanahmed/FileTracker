import { body } from "express-validator";
import { normalizePhoneNumber } from "../services/phone.service.js";

/**
 * Fields every "create X" route needs about the new user themselves.
 * departmentId/unitId are deliberately NOT part of this shared base --
 * whether they're accepted, required, or ignored depends entirely on the
 * creator's scope type (see userScope.service.js), which differs per route.
 */
const baseUserFieldsRules = [
  body("firstName").trim().notEmpty().withMessage("First name is required").isLength({ max: 100 }),
  body("lastName").trim().notEmpty().withMessage("Last name is required").isLength({ max: 100 }),
  body("middleName").optional({ checkFalsy: true }).trim().isLength({ max: 100 }),
  body("username")
    .trim()
    .notEmpty()
    .withMessage("Username is required")
    .isLength({ min: 3, max: 100 })
    .withMessage("Username must be between 3 and 100 characters"),
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Enter a valid email address")
    .normalizeEmail(),
  body("phoneNumber")
    .trim()
    .notEmpty()
    .withMessage("Phone number is required")
    .custom((value) => {
      normalizePhoneNumber(value);
      return true;
    })
    .withMessage("Enter a valid Tanzanian phone number (e.g. 0712345678)"),
  body("positionId").optional({ checkFalsy: true }).isString(),
];

const optionalScopeFieldRules = [
  body("departmentId").optional({ checkFalsy: true }).isString(),
  body("unitId").optional({ checkFalsy: true }).isString(),
];

/** SYSTEM_ADMIN has global scope but must still say which department an HOD leads. */
const requireDepartmentId = body("departmentId")
  .notEmpty()
  .withMessage("departmentId is required to select which department this Head of Department will lead");

/** HOD has department scope but must still say which unit gets the new Supervisor. */
const requireUnitId = body("unitId")
  .notEmpty()
  .withMessage("unitId is required to select which unit this Supervisor will lead");

// Director / Registry Officer / Archive Officer / ICT Administrator / Super Admin --
// all SYSTEM_ADMIN-created (GLOBAL scope), department/unit optional.
export const createGlobalRoleValidationRules = [...baseUserFieldsRules, ...optionalScopeFieldRules];

// Head of Department -- SYSTEM_ADMIN-created (GLOBAL scope), but department is mandatory input.
export const createHodValidationRules = [
  ...baseUserFieldsRules,
  requireDepartmentId,
  body("unitId").optional({ checkFalsy: true }).isString(),
];

// Unit Supervisor -- HOD-created (DEPARTMENT scope), unit is mandatory input.
export const createSupervisorValidationRules = [...baseUserFieldsRules, requireUnitId];

// Department Officer -- normally SUPERVISOR-created (UNIT scope, ids ignored),
// but the same route also serves the optional SYSTEM_ADMIN override (GLOBAL
// scope), so department/unit stay optional here rather than forbidden.
export const createOfficerValidationRules = [...baseUserFieldsRules, ...optionalScopeFieldRules];
