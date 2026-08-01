import { asyncHandler } from "../utils/asyncHandler.js";
import * as permissionService from "../services/permission.service.js";

export const createPermission = asyncHandler(async (req, res) => {
  const permission = await permissionService.createPermission({
    actorId: req.user.userId,
    payload: req.body,
    ipAddress: req.ip,
  });

  res.status(201).json({ success: true, message: "Permission created successfully.", data: permission });
});

export const getPermission = asyncHandler(async (req, res) => {
  const permission = await permissionService.getPermissionById(req.params.id);

  res.status(200).json({ success: true, message: "Permission retrieved successfully.", data: permission });
});

export const listPermissions = asyncHandler(async (req, res) => {
  const { items, meta } = await permissionService.listPermissions({ query: req.query });

  res.status(200).json({
    success: true,
    message: "Permissions retrieved successfully.",
    data: items,
    meta,
  });
});

export const getPermissionStats = asyncHandler(async (req, res) => {
  const stats = await permissionService.getPermissionStats();

  res.status(200).json({ success: true, message: "Permission statistics retrieved successfully.", data: stats });
});

export const updatePermission = asyncHandler(async (req, res) => {
  const permission = await permissionService.updatePermission({
    id: req.params.id,
    actorId: req.user.userId,
    payload: req.body,
    ipAddress: req.ip,
  });

  res.status(200).json({ success: true, message: "Permission updated successfully.", data: permission });
});

export const deactivatePermission = asyncHandler(async (req, res) => {
  const permission = await permissionService.deactivatePermission({
    id: req.params.id,
    actorId: req.user.userId,
    ipAddress: req.ip,
  });

  res.status(200).json({ success: true, message: "Permission deactivated successfully.", data: permission });
});

export const reactivatePermission = asyncHandler(async (req, res) => {
  const permission = await permissionService.reactivatePermission({
    id: req.params.id,
    actorId: req.user.userId,
    ipAddress: req.ip,
  });

  res.status(200).json({ success: true, message: "Permission reactivated successfully.", data: permission });
});
