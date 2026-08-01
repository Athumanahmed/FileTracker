import { asyncHandler } from "../utils/asyncHandler.js";
import * as roleService from "../services/role.service.js";

export const createRole = asyncHandler(async (req, res) => {
  const role = await roleService.createRole({
    actorId: req.user.userId,
    payload: req.body,
    ipAddress: req.ip,
  });

  res.status(201).json({ success: true, message: "Role created successfully.", data: role });
});

export const getRole = asyncHandler(async (req, res) => {
  const role = await roleService.getRoleById(req.params.id);

  res.status(200).json({ success: true, message: "Role retrieved successfully.", data: role });
});

export const listRoles = asyncHandler(async (req, res) => {
  const { items, meta } = await roleService.listRoles({ query: req.query });

  res.status(200).json({
    success: true,
    message: "Roles retrieved successfully.",
    data: items,
    meta,
  });
});

export const getRoleStats = asyncHandler(async (req, res) => {
  const stats = await roleService.getRoleStats();

  res.status(200).json({ success: true, message: "Role statistics retrieved successfully.", data: stats });
});

export const updateRole = asyncHandler(async (req, res) => {
  const role = await roleService.updateRole({
    id: req.params.id,
    actorId: req.user.userId,
    payload: req.body,
    ipAddress: req.ip,
  });

  res.status(200).json({ success: true, message: "Role updated successfully.", data: role });
});

export const deactivateRole = asyncHandler(async (req, res) => {
  const role = await roleService.deactivateRole({
    id: req.params.id,
    actorId: req.user.userId,
    ipAddress: req.ip,
  });

  res.status(200).json({ success: true, message: "Role deactivated successfully.", data: role });
});

export const reactivateRole = asyncHandler(async (req, res) => {
  const role = await roleService.reactivateRole({
    id: req.params.id,
    actorId: req.user.userId,
    ipAddress: req.ip,
  });

  res.status(200).json({ success: true, message: "Role reactivated successfully.", data: role });
});
