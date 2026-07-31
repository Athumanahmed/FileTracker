import { body, query } from "express-validator";

export const assignPermissionValidationRules = [
  body("roleId").trim().notEmpty().withMessage("roleId is required"),
  body("permissionId").trim().notEmpty().withMessage("permissionId is required"),
];

export const syncPermissionsValidationRules = [
  body("roleId").trim().notEmpty().withMessage("roleId is required"),
  body("permissionIds").isArray().withMessage("permissionIds must be an array"),
  body("permissionIds.*").isString().withMessage("Each permissionId must be a string"),
];

export const listRolePermissionsValidationRules = [
  query("page").optional().isInt({ min: 1 }).withMessage("page must be a positive integer"),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("limit must be between 1 and 100"),
  query("roleId").optional().trim(),
  query("permissionId").optional().trim(),
  query("sortBy").optional().isIn(["assignedAt"]),
  query("sortOrder").optional().isIn(["asc", "desc"]),
];
