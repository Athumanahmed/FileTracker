import { Router } from "express";
import * as permissionController from "../controller/permission.controller.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";
import { validateRequest } from "../middlewares/validation.js";
import {
  createPermissionValidationRules,
  updatePermissionValidationRules,
  listPermissionsValidationRules,
} from "../validators/permission.validation.js";

const router = Router();

router.post(
  "/",
  authenticate,
  authorize("PERMISSIONS.CREATE"),
  createPermissionValidationRules,
  validateRequest,
  permissionController.createPermission,
);

router.get(
  "/",
  authenticate,
  authorize("PERMISSIONS.READ"),
  listPermissionsValidationRules,
  validateRequest,
  permissionController.listPermissions,
);

router.get("/:id", authenticate, authorize("PERMISSIONS.READ"), permissionController.getPermission);

// code is intentionally NOT accepted here -- immutable after creation,
// since it's referenced literally by authorize("...") calls elsewhere.
router.put(
  "/:id",
  authenticate,
  authorize("PERMISSIONS.UPDATE"),
  updatePermissionValidationRules,
  validateRequest,
  permissionController.updatePermission,
);

// Soft delete -- acts as a system-wide kill switch (see permission.service.js),
// not a structural "has active children" block like Department/Unit/Position.
router.patch(
  "/:id/deactivate",
  authenticate,
  authorize("PERMISSIONS.DELETE"),
  permissionController.deactivatePermission,
);

router.patch(
  "/:id/reactivate",
  authenticate,
  authorize("PERMISSIONS.UPDATE"),
  permissionController.reactivatePermission,
);

export default router;
