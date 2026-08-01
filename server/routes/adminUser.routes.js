import { Router } from "express";
import * as adminUserUpdateController from "../controller/adminUserUpdate.controller.js";
import * as adminUserQueryController from "../controller/adminUserQuery.controller.js";
import * as userAccountStatusController from "../controller/userAccountStatus.controller.js";
import * as userPasswordAdminController from "../controller/userPasswordAdmin.controller.js";
import * as userRoleAssignmentController from "../controller/userRoleAssignment.controller.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";
import { validateRequest } from "../middlewares/validation.js";
import { updateUserByAdminValidationRules } from "../validators/adminUserUpdate.validation.js";
import { assignRoleValidationRules } from "../validators/userRoleAssignment.validation.js";
import { listUsersValidationRules } from "../validators/adminUserQuery.validation.js";

const router = Router();

// -- Read: global, unscoped listing/detail for the Users admin module ----
router.get(
  "/",
  authenticate,
  authorize("USERS.READ"),
  listUsersValidationRules,
  validateRequest,
  adminUserQueryController.listUsers,
);

// Must be registered before /:userId -- otherwise Express would match
// "stats" as a userId value and this route would never be reached.
router.get("/stats", authenticate, authorize("USERS.READ"), adminUserQueryController.getUserStats);

router.get("/:userId", authenticate, authorize("USERS.READ"), adminUserQueryController.getUserById);

// -- Administrative update: department/unit/position/contact info -------
// Role assignment is deliberately NOT handled here -- see the dedicated
// /roles routes below (userRoleAssignment.service.js).
router.put(
  "/:userId",
  authenticate,
  authorize("USERS.UPDATE"),
  updateUserByAdminValidationRules,
  validateRequest,
  adminUserUpdateController.updateUserByAdmin,
);

// -- Account status: activate / deactivate / lock / unlock ---------------
router.patch(
  "/:userId/activate",
  authenticate,
  authorize("USERS.ACTIVATE"),
  userAccountStatusController.activateUser,
);

router.patch(
  "/:userId/deactivate",
  authenticate,
  authorize("USERS.DEACTIVATE"),
  userAccountStatusController.deactivateUser,
);

router.patch("/:userId/lock", authenticate, authorize("USERS.LOCK"), userAccountStatusController.lockUser);

router.patch(
  "/:userId/unlock",
  authenticate,
  authorize("USERS.UNLOCK"),
  userAccountStatusController.unlockUser,
);

// -- Password reset --------------------------------------------------------
router.post(
  "/:userId/reset-password",
  authenticate,
  authorize("USERS.RESET_PASSWORD"),
  userPasswordAdminController.resetPasswordByAdmin,
);

// -- Role assignment -------------------------------------------------------
// Route-level permission is a coarse "may attempt this at all" gate;
// userRoleAssignment.service.js independently re-checks, via the same
// ROLE_CREATION_MATRIX used at user creation, that the actor actually has
// authority over this SPECIFIC role code.
router.post(
  "/:userId/roles",
  authenticate,
  authorize("USERS.ROLES.ASSIGN"),
  assignRoleValidationRules,
  validateRequest,
  userRoleAssignmentController.assignRole,
);

router.delete(
  "/:userId/roles/:roleCode",
  authenticate,
  authorize("USERS.ROLES.REMOVE"),
  userRoleAssignmentController.removeRole,
);

export default router;
