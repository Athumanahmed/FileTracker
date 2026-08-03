import { Router } from "express";
import * as archiveController from "../controller/archive.controller.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";

const router = Router();

// Retention dashboard: every archived file whose retention window has lapsed.
router.get("/expired-retention", authenticate, authorize("ARCHIVE.READ"), archiveController.listExpiredRetention);

export default router;
