import { query } from "express-validator";

export const departmentFilterValidationRules = [query("departmentId").optional().trim()];

export const officerFilterValidationRules = [query("userId").optional().trim()];

export const registrationsOverTimeValidationRules = [
  query("bucket").optional().isIn(["day", "month"]).withMessage("bucket must be day or month"),
  query("dateFrom").optional().isISO8601().withMessage("dateFrom must be a valid date"),
  query("dateTo").optional().isISO8601().withMessage("dateTo must be a valid date"),
  query("departmentId").optional().trim(),
];

const REPORTS = ["files", "department-performance", "officer-performance"];
const FORMATS = ["csv", "excel", "pdf"];

export const exportReportValidationRules = [
  query("report").trim().isIn(REPORTS).withMessage(`report must be one of ${REPORTS.join(", ")}`),
  query("format").trim().isIn(FORMATS).withMessage(`format must be one of ${FORMATS.join(", ")}`),
];
