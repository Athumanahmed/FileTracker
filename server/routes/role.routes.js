import { Router } from "express";
import * as roleController from "../controller/role.controller.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";
import { validateRequest } from "../middlewares/validation.js";
import {
  createRoleValidationRules,
  updateRoleValidationRules,
  listRolesValidationRules,
} from "../validators/role.validation.js";

const router = Router();

router.post(
  "/",
  authenticate,
  authorize("ROLES.CREATE"),
  createRoleValidationRules,
  validateRequest,
  roleController.createRole,
);

router.get(
  "/",
  authenticate,
  authorize("ROLES.READ"),
  listRolesValidationRules,
  validateRequest,
  roleController.listRoles,
);

router.get("/:id", authenticate, authorize("ROLES.READ"), roleController.getRole);

// code and isSystem are intentionally NOT accepted here -- both immutable
// after creation (see role.service.js).
router.put(
  "/:id",
  authenticate,
  authorize("ROLES.UPDATE"),
  updateRoleValidationRules,
  validateRequest,
  roleController.updateRole,
);

// Soft delete -- blocked entirely for system roles, and for custom roles
// still assigned to active users (see role.service.js).
router.patch("/:id/deactivate", authenticate, authorize("ROLES.DELETE"), roleController.deactivateRole);

router.patch("/:id/reactivate", authenticate, authorize("ROLES.UPDATE"), roleController.reactivateRole);

export default router;
