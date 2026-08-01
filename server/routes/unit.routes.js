import { Router } from "express";
import * as unitController from "../controller/unit.controller.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";
import { validateRequest } from "../middlewares/validation.js";
import {
  createUnitValidationRules,
  updateUnitValidationRules,
  listUnitsValidationRules,
} from "../validators/unit.validation.js";

const router = Router();

router.post(
  "/",
  authenticate,
  authorize("UNITS.CREATE"),
  createUnitValidationRules,
  validateRequest,
  unitController.createUnit,
);

router.get(
  "/",
  authenticate,
  authorize("UNITS.READ"),
  listUnitsValidationRules,
  validateRequest,
  unitController.listUnits,
);

// Registered before "/:id" -- otherwise Express would match "stats" as the :id param.
router.get("/stats", authenticate, authorize("UNITS.READ"), unitController.getUnitStats);

router.get("/:id", authenticate, authorize("UNITS.READ"), unitController.getUnit);

// departmentId is immutable after creation (a unit can't be moved between
// departments -- see unit.service.js), so it's simply not an accepted field here.
router.put(
  "/:id",
  authenticate,
  authorize("UNITS.UPDATE"),
  updateUnitValidationRules,
  validateRequest,
  unitController.updateUnit,
);

// Soft delete -- never a hard delete, Unit rows are referenced by Position/User.
router.patch("/:id/deactivate", authenticate, authorize("UNITS.DELETE"), unitController.deactivateUnit);

router.patch("/:id/reactivate", authenticate, authorize("UNITS.UPDATE"), unitController.reactivateUnit);

export default router;
