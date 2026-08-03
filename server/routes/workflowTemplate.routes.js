import { Router } from "express";
import * as workflowTemplateController from "../controller/workflowTemplate.controller.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";
import { validateRequest } from "../middlewares/validation.js";
import {
  createTemplateValidationRules,
  updateTemplateValidationRules,
  listTemplatesValidationRules,
  templateIdParamValidationRules,
  createStepValidationRules,
  updateStepValidationRules,
  stepIdParamValidationRules,
} from "../validators/workflowTemplate.validation.js";

const router = Router();

router.post(
  "/",
  authenticate,
  authorize("WORKFLOW_TEMPLATES.CREATE"),
  createTemplateValidationRules,
  validateRequest,
  workflowTemplateController.createTemplate,
);

router.get(
  "/",
  authenticate,
  authorize("WORKFLOW_TEMPLATES.READ"),
  listTemplatesValidationRules,
  validateRequest,
  workflowTemplateController.listTemplates,
);

router.get(
  "/:id",
  authenticate,
  authorize("WORKFLOW_TEMPLATES.READ"),
  templateIdParamValidationRules,
  validateRequest,
  workflowTemplateController.getTemplate,
);

router.put(
  "/:id",
  authenticate,
  authorize("WORKFLOW_TEMPLATES.UPDATE"),
  templateIdParamValidationRules,
  updateTemplateValidationRules,
  validateRequest,
  workflowTemplateController.updateTemplate,
);

router.patch(
  "/:id/deactivate",
  authenticate,
  authorize("WORKFLOW_TEMPLATES.DELETE"),
  templateIdParamValidationRules,
  validateRequest,
  workflowTemplateController.deactivateTemplate,
);

router.patch(
  "/:id/reactivate",
  authenticate,
  authorize("WORKFLOW_TEMPLATES.UPDATE"),
  templateIdParamValidationRules,
  validateRequest,
  workflowTemplateController.reactivateTemplate,
);

router.post(
  "/:id/steps",
  authenticate,
  authorize("WORKFLOW_TEMPLATES.UPDATE"),
  createStepValidationRules,
  validateRequest,
  workflowTemplateController.addStep,
);

router.get(
  "/:id/steps",
  authenticate,
  authorize("WORKFLOW_TEMPLATES.READ"),
  templateIdParamValidationRules,
  validateRequest,
  workflowTemplateController.listSteps,
);

router.put(
  "/:id/steps/:stepId",
  authenticate,
  authorize("WORKFLOW_TEMPLATES.UPDATE"),
  updateStepValidationRules,
  validateRequest,
  workflowTemplateController.updateStep,
);

router.patch(
  "/:id/steps/:stepId/deactivate",
  authenticate,
  authorize("WORKFLOW_TEMPLATES.UPDATE"),
  stepIdParamValidationRules,
  validateRequest,
  workflowTemplateController.deactivateStep,
);

export default router;
