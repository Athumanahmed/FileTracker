import { asyncHandler } from "../utils/asyncHandler.js";
import * as departmentService from "../services/department.service.js";

export const createDepartment = asyncHandler(async (req, res) => {
  const department = await departmentService.createDepartment({
    actorId: req.user.userId,
    payload: req.body,
    ipAddress: req.ip,
  });

  res.status(201).json({ success: true, message: "Department created successfully.", data: department });
});

export const getDepartment = asyncHandler(async (req, res) => {
  const department = await departmentService.getDepartmentById(req.params.id);

  res.status(200).json({ success: true, message: "Department retrieved successfully.", data: department });
});

export const listDepartments = asyncHandler(async (req, res) => {
  const { items, meta } = await departmentService.listDepartments({ query: req.query });

  res.status(200).json({
    success: true,
    message: "Departments retrieved successfully.",
    data: items,
    meta,
  });
});

export const updateDepartment = asyncHandler(async (req, res) => {
  const department = await departmentService.updateDepartment({
    id: req.params.id,
    actorId: req.user.userId,
    payload: req.body,
    ipAddress: req.ip,
  });

  res.status(200).json({ success: true, message: "Department updated successfully.", data: department });
});

export const deactivateDepartment = asyncHandler(async (req, res) => {
  const department = await departmentService.deactivateDepartment({
    id: req.params.id,
    actorId: req.user.userId,
    ipAddress: req.ip,
  });

  res.status(200).json({ success: true, message: "Department deactivated successfully.", data: department });
});

export const reactivateDepartment = asyncHandler(async (req, res) => {
  const department = await departmentService.reactivateDepartment({
    id: req.params.id,
    actorId: req.user.userId,
    ipAddress: req.ip,
  });

  res.status(200).json({ success: true, message: "Department reactivated successfully.", data: department });
});
