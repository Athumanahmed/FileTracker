import { Router } from "express";
import * as workflowEngineController from "../controller/workflowEngine.controller.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";
import { validateRequest } from "../middlewares/validation.js";
import {
  startWorkflowValidationRules,
  transitionWorkflowValidationRules,
  eligibleTargetsValidationRules,
  fileIdParamValidationRules,
} from "../validators/workflowEngine.validation.js";

// mergeParams -- mounted at /api/v1/files/:fileId/workflow.
const router = Router({ mergeParams: true });

router.get(
  "/",
  authenticate,
  authorize("WORKFLOW.READ"),
  fileIdParamValidationRules,
  validateRequest,
  workflowEngineController.getWorkflowStatus,
);

router.get(
  "/eligible-targets",
  authenticate,
  authorize("WORKFLOW.READ"),
  eligibleTargetsValidationRules,
  validateRequest,
  workflowEngineController.getEligibleTargets,
);

router.post(
  "/start",
  authenticate,
  authorize("WORKFLOW.MANAGE"),
  startWorkflowValidationRules,
  validateRequest,
  workflowEngineController.startWorkflow,
);

router.post(
  "/transition",
  authenticate,
  authorize("WORKFLOW.MANAGE"),
  transitionWorkflowValidationRules,
  validateRequest,
  workflowEngineController.transitionWorkflow,
);

// Archive/Restore moved to their own module (Phase 10) -- see
// routes/archive.routes.js, mounted at /api/v1/files/:fileId/archive.

router.post(
  "/claim",
  authenticate,
  authorize("WORKFLOW.MANAGE"),
  fileIdParamValidationRules,
  validateRequest,
  workflowEngineController.claimAssignment,
);

export default router;
