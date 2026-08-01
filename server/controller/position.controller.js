import { asyncHandler } from "../utils/asyncHandler.js";
import * as positionService from "../services/position.service.js";

export const createPosition = asyncHandler(async (req, res) => {
  const position = await positionService.createPosition({
    actorId: req.user.userId,
    payload: req.body,
    ipAddress: req.ip,
  });

  res.status(201).json({ success: true, message: "Position created successfully.", data: position });
});

export const getPosition = asyncHandler(async (req, res) => {
  const position = await positionService.getPositionById(req.params.id);

  res.status(200).json({ success: true, message: "Position retrieved successfully.", data: position });
});

export const listPositions = asyncHandler(async (req, res) => {
  const { items, meta } = await positionService.listPositions({ query: req.query });

  res.status(200).json({
    success: true,
    message: "Positions retrieved successfully.",
    data: items,
    meta,
  });
});

export const getPositionStats = asyncHandler(async (req, res) => {
  const stats = await positionService.getPositionStats();

  res.status(200).json({ success: true, message: "Position statistics retrieved successfully.", data: stats });
});

export const updatePosition = asyncHandler(async (req, res) => {
  const position = await positionService.updatePosition({
    id: req.params.id,
    actorId: req.user.userId,
    payload: req.body,
    ipAddress: req.ip,
  });

  res.status(200).json({ success: true, message: "Position updated successfully.", data: position });
});

export const deactivatePosition = asyncHandler(async (req, res) => {
  const position = await positionService.deactivatePosition({
    id: req.params.id,
    actorId: req.user.userId,
    ipAddress: req.ip,
  });

  res.status(200).json({ success: true, message: "Position deactivated successfully.", data: position });
});

export const reactivatePosition = asyncHandler(async (req, res) => {
  const position = await positionService.reactivatePosition({
    id: req.params.id,
    actorId: req.user.userId,
    ipAddress: req.ip,
  });

  res.status(200).json({ success: true, message: "Position reactivated successfully.", data: position });
});
