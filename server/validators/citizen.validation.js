import { body, param } from "express-validator";

export const setSmsPreferenceValidationRules = [
  param("id").trim().notEmpty(),
  body("smsNotificationsEnabled").isBoolean().withMessage("smsNotificationsEnabled must be a boolean").toBoolean(),
];
