import { Router } from "express";
import * as workflowEngineController from "../controller/workflowEngine.controller.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";

const router = Router();

// Escalation-ready read: every current assignment past its SLA-derived due date, across all files.
router.get("/overdue-assignments", authenticate, authorize("WORKFLOW.READ"), workflowEngineController.listOverdueAssignments);

export default router;
