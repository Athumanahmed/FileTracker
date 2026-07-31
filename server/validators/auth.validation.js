import { body } from "express-validator";
import { PASSWORD_COMPLEXITY_REGEX, PASSWORD_COMPLEXITY_MESSAGE } from "../utils/passwordPolicy.js";

/**
 * Deliberately generic messages -- validation errors for "username" must
 * not become an oracle for whether that username exists.
 */
export const loginValidationRules = [
  body("username")
    .trim()
    .notEmpty()
    .withMessage("Username is required")
    .isLength({ min: 3, max: 100 })
    .withMessage("Username must be between 3 and 100 characters"),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8, max: 128 })
    .withMessage("Password must be between 8 and 128 characters"),
];

/**
 * Cross-field checks (new !== current, confirm === new) run here on the
 * plaintext request body -- no DB access needed. Current-password
 * ownership, complexity vs. reuse against password history, etc. are
 * verified in the service layer where the DB record actually lives.
 */
export const forceChangePasswordValidationRules = [
  body("currentPassword").notEmpty().withMessage("Current password is required"),

  body("newPassword")
    .notEmpty()
    .withMessage("New password is required")
    .isLength({ min: 8, max: 128 })
    .withMessage("Password must be at least 8 characters")
    .matches(PASSWORD_COMPLEXITY_REGEX)
    .withMessage(PASSWORD_COMPLEXITY_MESSAGE)
    .custom((value, { req }) => value !== req.body.currentPassword)
    .withMessage("New password must be different from the current password"),

  body("confirmPassword")
    .notEmpty()
    .withMessage("Confirm password is required")
    .custom((value, { req }) => value === req.body.newPassword)
    .withMessage("Passwords do not match"),
];
