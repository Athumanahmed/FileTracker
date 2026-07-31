import { asyncHandler } from "../utils/asyncHandler.js";
import * as unitService from "../services/unit.service.js";

export const createUnit = asyncHandler(async (req, res) => {
  const unit = await unitService.createUnit({
    actorId: req.user.userId,
    payload: req.body,
    ipAddress: req.ip,
  });

  res.status(201).json({ success: true, message: "Unit created successfully.", data: unit });
});

export const getUnit = asyncHandler(async (req, res) => {
  const unit = await unitService.getUnitById(req.params.id);

  res.status(200).json({ success: true, message: "Unit retrieved successfully.", data: unit });
});

export const listUnits = asyncHandler(async (req, res) => {
  const { items, meta } = await unitService.listUnits({ query: req.query });

  res.status(200).json({
    success: true,
    message: "Units retrieved successfully.",
    data: items,
    meta,
  });
});

export const updateUnit = asyncHandler(async (req, res) => {
  const unit = await unitService.updateUnit({
    id: req.params.id,
    actorId: req.user.userId,
    payload: req.body,
    ipAddress: req.ip,
  });

  res.status(200).json({ success: true, message: "Unit updated successfully.", data: unit });
});

export const deactivateUnit = asyncHandler(async (req, res) => {
  const unit = await unitService.deactivateUnit({
    id: req.params.id,
    actorId: req.user.userId,
    ipAddress: req.ip,
  });

  res.status(200).json({ success: true, message: "Unit deactivated successfully.", data: unit });
});

export const reactivateUnit = asyncHandler(async (req, res) => {
  const unit = await unitService.reactivateUnit({
    id: req.params.id,
    actorId: req.user.userId,
    ipAddress: req.ip,
  });

  res.status(200).json({ success: true, message: "Unit reactivated successfully.", data: unit });
});
