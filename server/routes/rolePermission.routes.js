import { Router } from "express";
import * as rolePermissionController from "../controller/rolePermission.controller.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";
import { validateRequest } from "../middlewares/validation.js";
import {
  assignPermissionValidationRules,
  syncPermissionsValidationRules,
  listRolePermissionsValidationRules,
} from "../validators/rolePermission.validation.js";

const router = Router();

router.get(
  "/",
  authenticate,
  authorize("ROLE_PERMISSIONS.READ"),
  listRolePermissionsValidationRules,
  validateRequest,
  rolePermissionController.listRolePermissions,
);

router.post(
  "/",
  authenticate,
  authorize("ROLE_PERMISSIONS.ASSIGN"),
  assignPermissionValidationRules,
  validateRequest,
  rolePermissionController.assignPermission,
);

// Can both add and remove assignments, so both permissions are required.
router.post(
  "/sync",
  authenticate,
  authorize("ROLE_PERMISSIONS.ASSIGN"),
  authorize("ROLE_PERMISSIONS.REVOKE"),
  syncPermissionsValidationRules,
  validateRequest,
  rolePermissionController.syncRolePermissions,
);

router.get(
  "/:roleId/:permissionId",
  authenticate,
  authorize("ROLE_PERMISSIONS.READ"),
  rolePermissionController.getAssignment,
);

// Hard delete of the join row is correct here -- there's no soft-delete
// concept for a pure assignment; history lives in the audit log instead.
router.delete(
  "/:roleId/:permissionId",
  authenticate,
  authorize("ROLE_PERMISSIONS.REVOKE"),
  rolePermissionController.revokePermission,
);

export default router;
