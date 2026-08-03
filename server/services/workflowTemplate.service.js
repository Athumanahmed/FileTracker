import { AppError } from "../utils/AppError.js";
import { AUDIT_ACTIONS } from "../utils/auditActions.js";
import { parsePagination, parseSort, buildPaginationMeta, buildSearchClause, parseBooleanFilter } from "../utils/queryOptions.js";
import * as authRepository from "../repositories/auth.repository.js";
import * as workflowTemplateRepository from "../repositories/workflowTemplate.repository.js";
import * as fileCategoryRepository from "../repositories/fileCategory.repository.js";
import * as departmentRepository from "../repositories/department.repository.js";

const SORTABLE_FIELDS = ["name", "code", "createdAt", "updatedAt"];
const SEARCHABLE_FIELDS = ["name", "code"];

const sanitizeStep = (step) => ({
  id: step.id,
  templateId: step.templateId,
  stepOrder: step.stepOrder,
  name: step.name,
  description: step.description,
  requiredPositionId: step.requiredPositionId,
  requiredRoleId: step.requiredRoleId,
  slaHours: step.slaHours,
  isFinalStep: step.isFinalStep,
  allowedActions: step.allowedActions,
  isActive: step.isActive,
});

const sanitize = (template) => ({
  id: template.id,
  name: template.name,
  code: template.code,
  description: template.description,
  categoryId: template.categoryId,
  departmentId: template.departmentId,
  isActive: template.isActive,
  version: template.version,
  createdAt: template.createdAt,
  updatedAt: template.updatedAt,
  steps: template.steps?.map(sanitizeStep),
});

const sanitizeListItem = (template) => ({
  id: template.id,
  name: template.name,
  code: template.code,
  categoryId: template.categoryId,
  departmentId: template.departmentId,
  isActive: template.isActive,
  stepsCount: template._count?.steps ?? 0,
  instancesCount: template._count?.instances ?? 0,
  createdAt: template.createdAt,
});

const logAudit = ({ actorId, action, entityId, metadata, ipAddress }) =>
  authRepository.createAuditLog({
    userId: actorId,
    action,
    entity: "WorkflowTemplate",
    entityId,
    description: `${action} (${entityId})`,
    metadata: metadata ?? null,
    ipAddress,
  });

const rethrowAsConflict = (err, label) => {
  if (err.code === "P2002") {
    throw new AppError(409, `A ${label} with this ${err.meta?.target?.[0] || "value"} already exists`);
  }
  throw err;
};

const assertReferencesExist = async ({ categoryId, departmentId }) => {
  if (categoryId) {
    const category = await fileCategoryRepository.findById(categoryId);
    if (!category) throw new AppError(404, "File category not found or inactive");
  }
  if (departmentId) {
    const department = await departmentRepository.findById(departmentId);
    if (!department || !department.isActive) throw new AppError(404, "Department not found or inactive");
  }
};

export const createTemplate = async ({ actorId, payload, ipAddress }) => {
  await assertReferencesExist(payload);

  let template;
  try {
    template = await workflowTemplateRepository.create({
      name: payload.name,
      code: payload.code,
      description: payload.description || null,
      categoryId: payload.categoryId || null,
      departmentId: payload.departmentId || null,
    });
  } catch (err) {
    rethrowAsConflict(err, "workflow template");
  }

  await logAudit({ actorId, action: AUDIT_ACTIONS.WORKFLOW_TEMPLATE_CREATED, entityId: template.id, metadata: { code: template.code }, ipAddress });

  return sanitize({ ...template, steps: [] });
};

export const getTemplateById = async (id) => {
  const template = await workflowTemplateRepository.findById(id);
  if (!template) throw new AppError(404, "Workflow template not found");
  return sanitize(template);
};

export const listTemplates = async ({ query }) => {
  const { page, limit, skip, take } = parsePagination(query);
  const orderBy = parseSort(query, SORTABLE_FIELDS, "name");
  const isActive = parseBooleanFilter(query.isActive);

  const where = {
    ...(isActive !== undefined ? { isActive } : {}),
    ...(query.departmentId ? { departmentId: query.departmentId } : {}),
    ...(query.categoryId ? { categoryId: query.categoryId } : {}),
    ...buildSearchClause(query.search, SEARCHABLE_FIELDS),
  };

  const [items, total] = await Promise.all([
    workflowTemplateRepository.findMany({ where, orderBy, skip, take }),
    workflowTemplateRepository.count(where),
  ]);

  return { items: items.map(sanitizeListItem), meta: buildPaginationMeta(total, page, limit) };
};

export const updateTemplate = async ({ id, actorId, payload, ipAddress }) => {
  const existing = await workflowTemplateRepository.findById(id);
  if (!existing) throw new AppError(404, "Workflow template not found");

  await assertReferencesExist(payload);

  let updated;
  try {
    updated = await workflowTemplateRepository.update(id, {
      name: payload.name ?? existing.name,
      description: payload.description !== undefined ? payload.description : existing.description,
      categoryId: payload.categoryId !== undefined ? payload.categoryId || null : existing.categoryId,
      departmentId: payload.departmentId !== undefined ? payload.departmentId || null : existing.departmentId,
    });
  } catch (err) {
    rethrowAsConflict(err, "workflow template");
  }

  await logAudit({ actorId, action: AUDIT_ACTIONS.WORKFLOW_TEMPLATE_UPDATED, entityId: id, ipAddress });

  return sanitize({ ...updated, steps: existing.steps });
};

export const setTemplateActive = async ({ id, actorId, isActive, ipAddress }) => {
  const existing = await workflowTemplateRepository.findById(id);
  if (!existing) throw new AppError(404, "Workflow template not found");
  if (existing.isActive === isActive) throw new AppError(409, `Workflow template is already ${isActive ? "active" : "inactive"}`);

  const updated = await workflowTemplateRepository.setActive(id, isActive);

  await logAudit({
    actorId,
    action: isActive ? AUDIT_ACTIONS.WORKFLOW_TEMPLATE_REACTIVATED : AUDIT_ACTIONS.WORKFLOW_TEMPLATE_DEACTIVATED,
    entityId: id,
    ipAddress,
  });

  return sanitize({ ...updated, steps: existing.steps });
};

// ---------------------------------------------------------------------
// Steps
// ---------------------------------------------------------------------

const assertStepReferencesExist = async ({ requiredPositionId, requiredRoleId }) => {
  // Deliberately not FK-validated against Position/Role repositories here --
  // both are tiny, rarely-changing tables and Prisma's own FK constraint
  // already rejects a bogus id at the database level with a clear P2003.
  // Avoids two extra round trips on every step write for a check the DB
  // performs for free.
  return { requiredPositionId: requiredPositionId || null, requiredRoleId: requiredRoleId || null };
};

export const addStep = async ({ templateId, actorId, payload, ipAddress }) => {
  const template = await workflowTemplateRepository.findById(templateId);
  if (!template) throw new AppError(404, "Workflow template not found");

  const refs = await assertStepReferencesExist(payload);

  let step;
  try {
    step = await workflowTemplateRepository.createStep({
      templateId,
      stepOrder: payload.stepOrder,
      name: payload.name,
      description: payload.description || null,
      requiredPositionId: refs.requiredPositionId,
      requiredRoleId: refs.requiredRoleId,
      slaHours: payload.slaHours ?? null,
      isFinalStep: payload.isFinalStep ?? false,
      allowedActions: payload.allowedActions ?? [],
    });
  } catch (err) {
    if (err.code === "P2002") throw new AppError(409, `Step order ${payload.stepOrder} already exists on this template`);
    if (err.code === "P2003") throw new AppError(404, "requiredPositionId or requiredRoleId does not exist");
    throw err;
  }

  await logAudit({ actorId, action: AUDIT_ACTIONS.WORKFLOW_STEP_CREATED, entityId: step.id, metadata: { templateId, stepOrder: step.stepOrder }, ipAddress });

  return sanitizeStep(step);
};

export const listSteps = async (templateId) => {
  const template = await workflowTemplateRepository.findById(templateId);
  if (!template) throw new AppError(404, "Workflow template not found");
  const steps = await workflowTemplateRepository.findStepsByTemplate(templateId);
  return steps.map(sanitizeStep);
};

export const updateStep = async ({ templateId, stepId, actorId, payload, ipAddress }) => {
  const step = await workflowTemplateRepository.findStepById(stepId);
  if (!step || step.templateId !== templateId) throw new AppError(404, "Workflow step not found");

  const refs = await assertStepReferencesExist(
    payload.requiredPositionId !== undefined || payload.requiredRoleId !== undefined
      ? payload
      : { requiredPositionId: step.requiredPositionId, requiredRoleId: step.requiredRoleId },
  );

  let updated;
  try {
    updated = await workflowTemplateRepository.updateStep(stepId, {
      name: payload.name ?? step.name,
      description: payload.description !== undefined ? payload.description : step.description,
      requiredPositionId: refs.requiredPositionId,
      requiredRoleId: refs.requiredRoleId,
      slaHours: payload.slaHours !== undefined ? payload.slaHours : step.slaHours,
      isFinalStep: payload.isFinalStep !== undefined ? payload.isFinalStep : step.isFinalStep,
      allowedActions: payload.allowedActions ?? step.allowedActions,
    });
  } catch (err) {
    if (err.code === "P2003") throw new AppError(404, "requiredPositionId or requiredRoleId does not exist");
    throw err;
  }

  await logAudit({ actorId, action: AUDIT_ACTIONS.WORKFLOW_STEP_UPDATED, entityId: stepId, ipAddress });

  return sanitizeStep(updated);
};

export const deactivateStep = async ({ templateId, stepId, actorId, ipAddress }) => {
  const step = await workflowTemplateRepository.findStepById(stepId);
  if (!step || step.templateId !== templateId) throw new AppError(404, "Workflow step not found");
  if (!step.isActive) throw new AppError(409, "Workflow step is already inactive");

  const updated = await workflowTemplateRepository.setStepActive(stepId, false);

  await logAudit({ actorId, action: AUDIT_ACTIONS.WORKFLOW_STEP_DEACTIVATED, entityId: stepId, ipAddress });

  return sanitizeStep(updated);
};
