import { Router } from "express";
import { createUserHandler } from "../controller/user.controller.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";
import { validateRequest } from "../middlewares/validation.js";
import {
  createGlobalRoleValidationRules,
  createHodValidationRules,
  createSupervisorValidationRules,
  createOfficerValidationRules,
} from "../validators/user.validation.js";

const router = Router();

// -- Super Administrator (global scope) --------------------------------

router.post(
  "/directors",
  authenticate,
  authorize("USERS.CREATE.DIRECTOR"),
  createGlobalRoleValidationRules,
  validateRequest,
  createUserHandler("DIRECTOR"),
);

router.post(
  "/hods",
  authenticate,
  authorize("USERS.CREATE.HOD"),
  createHodValidationRules,
  validateRequest,
  createUserHandler("HOD"),
);

router.post(
  "/registry-officers",
  authenticate,
  authorize("USERS.CREATE.REGISTRY"),
  createGlobalRoleValidationRules,
  validateRequest,
  createUserHandler("REGISTRY"),
);

router.post(
  "/archive-officers",
  authenticate,
  authorize("USERS.CREATE.ARCHIVE"),
  createGlobalRoleValidationRules,
  validateRequest,
  createUserHandler("ARCHIVE"),
);

router.post(
  "/ict-admins",
  authenticate,
  authorize("USERS.CREATE.ICT_ADMIN"),
  createGlobalRoleValidationRules,
  validateRequest,
  createUserHandler("ICT_ADMIN"),
);

// Off by default -- nobody holds USERS.CREATE.SUPER_ADMIN until it's
// explicitly granted (see seedRolePermissions.js).
router.post(
  "/super-admins",
  authenticate,
  authorize("USERS.CREATE.SUPER_ADMIN"),
  createGlobalRoleValidationRules,
  validateRequest,
  createUserHandler("SYSTEM_ADMIN"),
);

// -- Head of Department (department scope) ------------------------------

router.post(
  "/supervisors",
  authenticate,
  authorize("USERS.CREATE.SUPERVISOR"),
  createSupervisorValidationRules,
  validateRequest,
  createUserHandler("SUPERVISOR"),
);

// -- Unit Supervisor (unit scope) ---------------------------------------
// Also reachable by SYSTEM_ADMIN as a direct-creation override, but only
// once USERS.CREATE.OFFICER is explicitly granted to that role too.

router.post(
  "/officers",
  authenticate,
  authorize("USERS.CREATE.OFFICER"),
  createOfficerValidationRules,
  validateRequest,
  createUserHandler("OFFICER"),
);

export default router;
