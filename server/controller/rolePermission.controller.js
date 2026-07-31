import { asyncHandler } from "../utils/asyncHandler.js";
import * as rolePermissionService from "../services/rolePermission.service.js";

export const assignPermission = asyncHandler(async (req, res) => {
  const assignment = await rolePermissionService.assignPermission({
    actorId: req.user.userId,
    roleId: req.body.roleId,
    permissionId: req.body.permissionId,
    ipAddress: req.ip,
  });

  res.status(201).json({
    success: true,
    message: "Permission assigned to role successfully.",
    data: assignment,
  });
});

export const revokePermission = asyncHandler(async (req, res) => {
  const result = await rolePermissionService.revokePermission({
    actorId: req.user.userId,
    roleId: req.params.roleId,
    permissionId: req.params.permissionId,
    ipAddress: req.ip,
  });

  res.status(200).json({
    success: true,
    message: "Permission revoked from role successfully.",
    data: result,
  });
});

export const getAssignment = asyncHandler(async (req, res) => {
  const assignment = await rolePermissionService.getAssignment(req.params.roleId, req.params.permissionId);

  res.status(200).json({ success: true, message: "Assignment retrieved successfully.", data: assignment });
});

export const listRolePermissions = asyncHandler(async (req, res) => {
  const { items, meta } = await rolePermissionService.listRolePermissions({ query: req.query });

  res.status(200).json({
    success: true,
    message: "Role permissions retrieved successfully.",
    data: items,
    meta,
  });
});

export const syncRolePermissions = asyncHandler(async (req, res) => {
  const result = await rolePermissionService.syncRolePermissions({
    actorId: req.user.userId,
    roleId: req.body.roleId,
    permissionIds: req.body.permissionIds,
    ipAddress: req.ip,
  });

  res.status(200).json({ success: true, message: "Role permissions synced successfully.", data: result });
});
