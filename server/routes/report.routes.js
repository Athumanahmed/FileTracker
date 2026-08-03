import { Router } from "express";
import * as reportController from "../controller/report.controller.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";
import { validateRequest } from "../middlewares/validation.js";
import {
  departmentFilterValidationRules,
  officerFilterValidationRules,
  registrationsOverTimeValidationRules,
  exportReportValidationRules,
} from "../validators/report.validation.js";

const router = Router();

router.get(
  "/dashboard",
  authenticate,
  authorize("REPORTS.READ"),
  departmentFilterValidationRules,
  validateRequest,
  reportController.getDashboardKpis,
);

router.get(
  "/department-performance",
  authenticate,
  authorize("REPORTS.READ"),
  departmentFilterValidationRules,
  validateRequest,
  reportController.getDepartmentPerformance,
);

router.get(
  "/officer-performance",
  authenticate,
  authorize("REPORTS.READ"),
  officerFilterValidationRules,
  validateRequest,
  reportController.getOfficerPerformance,
);

router.get(
  "/charts/status-distribution",
  authenticate,
  authorize("REPORTS.READ"),
  departmentFilterValidationRules,
  validateRequest,
  reportController.getStatusDistribution,
);

router.get(
  "/charts/registrations-over-time",
  authenticate,
  authorize("REPORTS.READ"),
  registrationsOverTimeValidationRules,
  validateRequest,
  reportController.getRegistrationsOverTime,
);

router.get(
  "/export",
  authenticate,
  authorize("REPORTS.READ"),
  exportReportValidationRules,
  validateRequest,
  reportController.exportReport,
);

export default router;
