import { asyncHandler } from "../utils/asyncHandler.js";
import * as workflowTemplateService from "../services/workflowTemplate.service.js";

export const createTemplate = asyncHandler(async (req, res) => {
  const template = await workflowTemplateService.createTemplate({
    actorId: req.user.userId,
    payload: req.body,
    ipAddress: req.ip,
  });
  res.status(201).json({ success: true, message: "Workflow template created successfully.", data: template });
});

export const getTemplate = asyncHandler(async (req, res) => {
  const template = await workflowTemplateService.getTemplateById(req.params.id);
  res.status(200).json({ success: true, message: "Workflow template retrieved successfully.", data: template });
});

export const listTemplates = asyncHandler(async (req, res) => {
  const { items, meta } = await workflowTemplateService.listTemplates({ query: req.query });
  res.status(200).json({ success: true, message: "Workflow templates retrieved successfully.", data: items, meta });
});

export const updateTemplate = asyncHandler(async (req, res) => {
  const template = await workflowTemplateService.updateTemplate({
    id: req.params.id,
    actorId: req.user.userId,
    payload: req.body,
    ipAddress: req.ip,
  });
  res.status(200).json({ success: true, message: "Workflow template updated successfully.", data: template });
});

export const deactivateTemplate = asyncHandler(async (req, res) => {
  const template = await workflowTemplateService.setTemplateActive({
    id: req.params.id,
    actorId: req.user.userId,
    isActive: false,
    ipAddress: req.ip,
  });
  res.status(200).json({ success: true, message: "Workflow template deactivated successfully.", data: template });
});

export const reactivateTemplate = asyncHandler(async (req, res) => {
  const template = await workflowTemplateService.setTemplateActive({
    id: req.params.id,
    actorId: req.user.userId,
    isActive: true,
    ipAddress: req.ip,
  });
  res.status(200).json({ success: true, message: "Workflow template reactivated successfully.", data: template });
});

export const addStep = asyncHandler(async (req, res) => {
  const step = await workflowTemplateService.addStep({
    templateId: req.params.id,
    actorId: req.user.userId,
    payload: req.body,
    ipAddress: req.ip,
  });
  res.status(201).json({ success: true, message: "Workflow step created successfully.", data: step });
});

export const listSteps = asyncHandler(async (req, res) => {
  const steps = await workflowTemplateService.listSteps(req.params.id);
  res.status(200).json({ success: true, message: "Workflow steps retrieved successfully.", data: steps });
});

export const updateStep = asyncHandler(async (req, res) => {
  const step = await workflowTemplateService.updateStep({
    templateId: req.params.id,
    stepId: req.params.stepId,
    actorId: req.user.userId,
    payload: req.body,
    ipAddress: req.ip,
  });
  res.status(200).json({ success: true, message: "Workflow step updated successfully.", data: step });
});

export const deactivateStep = asyncHandler(async (req, res) => {
  const step = await workflowTemplateService.deactivateStep({
    templateId: req.params.id,
    stepId: req.params.stepId,
    actorId: req.user.userId,
    ipAddress: req.ip,
  });
  res.status(200).json({ success: true, message: "Workflow step deactivated successfully.", data: step });
});
