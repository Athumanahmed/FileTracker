import { Router } from "express";
import * as archiveController from "../controller/archive.controller.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";

const router = Router();

// Archive Dashboard: at-a-glance counts + retention-runway distribution.
router.get("/stats", authenticate, authorize("ARCHIVE.READ"), archiveController.getArchiveStats);

// Retention dashboard: every archived file whose retention window has lapsed.
router.get("/expired-retention", authenticate, authorize("ARCHIVE.READ"), archiveController.listExpiredRetention);

export default router;
