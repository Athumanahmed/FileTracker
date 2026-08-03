import { asyncHandler } from "../utils/asyncHandler.js";
import * as workflowEngineService from "../services/workflowEngine.service.js";

export const startWorkflow = asyncHandler(async (req, res) => {
  const result = await workflowEngineService.startWorkflow({
    fileId: req.params.fileId,
    templateId: req.body.templateId,
    toUserId: req.body.toUserId,
    remarks: req.body.remarks,
    actorId: req.user.userId,
    ipAddress: req.ip,
  });
  res.status(201).json({ success: true, message: "Workflow started successfully.", data: result });
});

export const transitionWorkflow = asyncHandler(async (req, res) => {
  const result = await workflowEngineService.transitionWorkflow({
    fileId: req.params.fileId,
    action: req.body.action,
    toUserId: req.body.toUserId,
    remarks: req.body.remarks,
    actorId: req.user.userId,
    ipAddress: req.ip,
  });
  res.status(200).json({ success: true, message: `Workflow ${req.body.action.toLowerCase()} completed successfully.`, data: result });
});

export const claimAssignment = asyncHandler(async (req, res) => {
  const assignment = await workflowEngineService.claimAssignment({
    fileId: req.params.fileId,
    actorId: req.user.userId,
    ipAddress: req.ip,
  });
  res.status(200).json({ success: true, message: "Assignment claimed successfully.", data: assignment });
});

export const getWorkflowStatus = asyncHandler(async (req, res) => {
  const status = await workflowEngineService.getWorkflowStatus(req.params.fileId);
  res.status(200).json({ success: true, message: "Workflow status retrieved successfully.", data: status });
});

export const listOverdueAssignments = asyncHandler(async (req, res) => {
  const overdue = await workflowEngineService.listOverdueAssignments();
  res.status(200).json({ success: true, message: "Overdue assignments retrieved successfully.", data: overdue });
});
