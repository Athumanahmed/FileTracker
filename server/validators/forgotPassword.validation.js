import { body } from "express-validator";
import { normalizePhoneNumber } from "../services/phone.service.js";
import { PASSWORD_COMPLEXITY_REGEX, PASSWORD_COMPLEXITY_MESSAGE } from "../utils/passwordPolicy.js";

/**
 * Delegates the actual format check to normalizePhoneNumber() so the
 * validator and the service can never disagree on what "valid" means.
 * The generic .withMessage() below overrides whatever normalizePhoneNumber
 * throws -- callers never see internal error text here.
 */
const phoneNumberRule = () =>
  body("phoneNumber")
    .trim()
    .notEmpty()
    .withMessage("Phone number is required")
    .custom((value) => {
      normalizePhoneNumber(value);
      return true;
    })
    .withMessage("Enter a valid Tanzanian phone number (e.g. 0712345678)");

export const forgotPasswordValidationRules = [phoneNumberRule()];

export const resendResetOtpValidationRules = [phoneNumberRule()];

export const verifyResetOtpValidationRules = [
  phoneNumberRule(),
  body("otp")
    .trim()
    .notEmpty()
    .withMessage("OTP is required")
    .isLength({ min: 6, max: 6 })
    .withMessage("OTP must be exactly 6 digits")
    .isNumeric()
    .withMessage("OTP must contain only digits"),
];

export const resetPasswordValidationRules = [
  body("newPassword")
    .notEmpty()
    .withMessage("New password is required")
    .isLength({ min: 8, max: 128 })
    .withMessage("Password must be at least 8 characters")
    .matches(PASSWORD_COMPLEXITY_REGEX)
    .withMessage(PASSWORD_COMPLEXITY_MESSAGE),

  body("confirmPassword")
    .notEmpty()
    .withMessage("Confirm password is required")
    .custom((value, { req }) => value === req.body.newPassword)
    .withMessage("Passwords do not match"),
];
