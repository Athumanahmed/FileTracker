import { query } from "express-validator";

export const trackFileValidationRules = [
  query("trackingNumber").trim().notEmpty().withMessage("trackingNumber is required").isLength({ max: 60 }),
  query("phone").trim().notEmpty().withMessage("phone is required").isLength({ max: 20 }),
];
