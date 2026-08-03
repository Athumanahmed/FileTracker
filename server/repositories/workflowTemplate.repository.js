import prisma from "../config/prisma.js";

/** Data-access layer for WorkflowTemplate + WorkflowStep (admin/config side of the workflow engine). */

// ---------------------------------------------------------------------
// Template
// ---------------------------------------------------------------------

export const findByCode = (code) => prisma.workflowTemplate.findUnique({ where: { code } });

export const findById = (id) =>
  prisma.workflowTemplate.findUnique({
    where: { id },
    include: { steps: { orderBy: { stepOrder: "asc" } }, category: true, department: true },
  });

export const create = (data) => prisma.workflowTemplate.create({ data });

export const update = (id, data) => prisma.workflowTemplate.update({ where: { id }, data });

export const setActive = (id, isActive) => prisma.workflowTemplate.update({ where: { id }, data: { isActive } });

export const findMany = ({ where, orderBy, skip, take }) =>
  prisma.workflowTemplate.findMany({
    where,
    orderBy,
    skip,
    take,
    include: { _count: { select: { steps: true, instances: true } } },
  });

export const count = (where) => prisma.workflowTemplate.count({ where });

// ---------------------------------------------------------------------
// Step
// ---------------------------------------------------------------------

export const findStepById = (id) => prisma.workflowStep.findUnique({ where: { id } });

export const findStepsByTemplate = (templateId) =>
  prisma.workflowStep.findMany({ where: { templateId, isActive: true }, orderBy: { stepOrder: "asc" } });

export const findFirstStep = (templateId) =>
  prisma.workflowStep.findFirst({ where: { templateId, isActive: true }, orderBy: { stepOrder: "asc" } });

export const findStepByOrder = (templateId, stepOrder) =>
  prisma.workflowStep.findFirst({ where: { templateId, stepOrder, isActive: true } });

export const createStep = (data) => prisma.workflowStep.create({ data });

export const updateStep = (id, data) => prisma.workflowStep.update({ where: { id }, data });

export const setStepActive = (id, isActive) => prisma.workflowStep.update({ where: { id }, data: { isActive } });
