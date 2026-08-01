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

export default router;
