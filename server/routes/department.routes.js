import { Router } from "express";
import * as departmentController from "../controller/department.controller.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";
import { validateRequest } from "../middlewares/validation.js";
import {
  createDepartmentValidationRules,
  updateDepartmentValidationRules,
  listDepartmentsValidationRules,
} from "../validators/department.validation.js";

const router = Router();

router.post(
  "/",
  authenticate,
  authorize("DEPARTMENTS.CREATE"),
  createDepartmentValidationRules,
  validateRequest,
  departmentController.createDepartment,
);

router.get(
  "/",
  authenticate,
  authorize("DEPARTMENTS.READ"),
  listDepartmentsValidationRules,
  validateRequest,
  departmentController.listDepartments,
);

// Registered before "/:id" -- otherwise Express would match "stats" as the :id param.
router.get("/stats", authenticate, authorize("DEPARTMENTS.READ"), departmentController.getDepartmentStats);

router.get("/:id", authenticate, authorize("DEPARTMENTS.READ"), departmentController.getDepartment);

router.put(
  "/:id",
  authenticate,
  authorize("DEPARTMENTS.UPDATE"),
  updateDepartmentValidationRules,
  validateRequest,
  departmentController.updateDepartment,
);

// Soft delete -- never a hard delete, Department rows are referenced by Unit/User.
router.patch(
  "/:id/deactivate",
  authenticate,
  authorize("DEPARTMENTS.DELETE"),
  departmentController.deactivateDepartment,
);

router.patch(
  "/:id/reactivate",
  authenticate,
  authorize("DEPARTMENTS.UPDATE"),
  departmentController.reactivateDepartment,
);

export default router;
