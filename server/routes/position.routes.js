import { Router } from "express";
import * as positionController from "../controller/position.controller.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";
import { validateRequest } from "../middlewares/validation.js";
import {
  createPositionValidationRules,
  updatePositionValidationRules,
  listPositionsValidationRules,
} from "../validators/position.validation.js";

const router = Router();

router.post(
  "/",
  authenticate,
  authorize("POSITIONS.CREATE"),
  createPositionValidationRules,
  validateRequest,
  positionController.createPosition,
);

router.get(
  "/",
  authenticate,
  authorize("POSITIONS.READ"),
  listPositionsValidationRules,
  validateRequest,
  positionController.listPositions,
);

// Registered before "/:id" -- otherwise Express would match "stats" as the :id param.
router.get("/stats", authenticate, authorize("POSITIONS.READ"), positionController.getPositionStats);

router.get("/:id", authenticate, authorize("POSITIONS.READ"), positionController.getPosition);

// unitId is immutable after creation (a position can't be moved between
// units -- see position.service.js), so it's simply not an accepted field here.
router.put(
  "/:id",
  authenticate,
  authorize("POSITIONS.UPDATE"),
  updatePositionValidationRules,
  validateRequest,
  positionController.updatePosition,
);

// Soft delete -- never a hard delete, Position rows are referenced by User.
router.patch(
  "/:id/deactivate",
  authenticate,
  authorize("POSITIONS.DELETE"),
  positionController.deactivatePosition,
);

router.patch(
  "/:id/reactivate",
  authenticate,
  authorize("POSITIONS.UPDATE"),
  positionController.reactivatePosition,
);

export default router;
