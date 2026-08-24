import { Router } from "express";
import * as dashboardController from "../controller/dashboard.controller.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";

const router = Router();

router.get(
  "/admin/summary",
  authenticate,
  authorize("DASHBOARD.READ_ADMIN_SUMMARY"),
  dashboardController.getAdminSummary,
);

router.get(
  "/admin/recent-activity",
  authenticate,
  authorize("DASHBOARD.READ_ADMIN_SUMMARY"),
  dashboardController.getRecentActivity,
);

// Entity filter options for the Audit Logs page's dropdown.
router.get(
  "/admin/audit-logs/entities",
  authenticate,
  authorize("DASHBOARD.READ_ADMIN_SUMMARY"),
  dashboardController.getAuditLogEntityOptions,
);

router.get(
  "/admin/audit-logs",
  authenticate,
  authorize("DASHBOARD.READ_ADMIN_SUMMARY"),
  dashboardController.getAuditLogs,
);

// Shared by every DEPARTMENT/UNIT-scoped role (HOD, SUPERVISOR) -- the
// response shape adapts to the actor's own scope (see
// dashboard.service.js#getScopedSummary), not two near-identical routes.
router.get(
  "/scoped/summary",
  authenticate,
  authorize("DASHBOARD.READ_SCOPED_SUMMARY"),
  dashboardController.getScopedSummary,
);

router.get(
  "/scoped/recent-activity",
  authenticate,
  authorize("DASHBOARD.READ_SCOPED_SUMMARY"),
  dashboardController.getScopedRecentActivity,
);

export default router;
