import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Workflow,
  Pencil,
  Plus,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Clock,
  Flag,
  Trash2,
  CheckCircle2,
  XCircle,
  FileText,
  Building2,
  Tag,
} from "lucide-react";
import PageHeader from "../../components/shared/PageHeader";
import ConfirmDialog from "../../components/shared/ConfirmDialog";
import EditWorkflowTemplateModal from "../../components/workflowTemplates/EditWorkflowTemplateModal";
import WorkflowStepFormModal from "../../components/workflowTemplates/WorkflowStepFormModal";
import { useWorkflowTemplate } from "../../hooks/useWorkflowTemplate";
import { useWorkflowStepActions } from "../../hooks/useWorkflowStepActions";
import { useUpdateOrgEntity } from "../../hooks/useUpdateOrgEntity";
import { useOrgEntityStatusAction } from "../../hooks/useOrgEntityStatusAction";
import { useRoles } from "../../hooks/useRoles";
import { useDepartments } from "../../hooks/useDepartments";
import { useFileCategories } from "../../hooks/useFileCategories";
import { deactivateWorkflowTemplate, reactivateWorkflowTemplate, updateWorkflowTemplate } from "../../utils/apiServices";
import useAuthStore from "../../store/authStore";
import { PERMISSIONS } from "../../utils/permissions";
import { formatDateTime } from "../../utils/formatters";
import { WORKFLOW_ACTION_LABELS } from "../../utils/workflowActions";

const BASE_PATH = "/admin";
const INVALIDATE_KEYS = ["admin-workflow-templates-list", "admin-workflow-template", "workflow-templates-list"];

const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3 py-3">
    <Icon size={16} className="mt-0.5 shrink-0 text-gray-400" />
    <div className="min-w-0">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-sm font-medium text-gray-800 break-words">{value || "—"}</p>
    </div>
  </div>
);

const StepCard = ({ step, roleName, canEdit, canDelete, onEdit, onDelete }) => (
  <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-start gap-3 min-w-0">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primaryBlueLight text-sm font-bold text-primaryBlue">
          {step.stepOrder}
        </span>
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 flex items-center gap-2 flex-wrap">
            {step.name}
            {step.isFinalStep && (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700">
                <Flag size={11} /> Final
              </span>
            )}
          </p>
          {step.description && <p className="text-xs text-gray-500 mt-0.5">{step.description}</p>}
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-600">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck size={13} className="text-gray-400" />
              {roleName || "Anyone"}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock size={13} className="text-gray-400" />
              {step.slaHours ? `${step.slaHours}h SLA` : "No SLA"}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {step.allowedActions?.length ? (
              step.allowedActions.map((a) => (
                <span key={a} className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[11px] font-medium text-gray-600">
                  {WORKFLOW_ACTION_LABELS[a] ?? a}
                </span>
              ))
            ) : (
              <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[11px] font-medium text-gray-500">
                All actions allowed
              </span>
            )}
          </div>
        </div>
      </div>
      {(canEdit || canDelete) && (
        <div className="flex shrink-0 gap-1">
          {canEdit && (
            <button
              type="button"
              onClick={() => onEdit(step)}
              aria-label={`Edit step ${step.stepOrder}`}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            >
              <Pencil size={14} />
            </button>
          )}
          {canDelete && (
            <button
              type="button"
              onClick={() => onDelete(step)}
              aria-label={`Deactivate step ${step.stepOrder}`}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      )}
    </div>
  </div>
);

const WorkflowTemplateDetails = () => {
  const { templateId } = useParams();
  const perms = useAuthStore((state) => state.user?.permissions);
  const canEdit = Boolean(perms?.includes(PERMISSIONS.WORKFLOW_TEMPLATES_UPDATE));
  const canManageStatus =
    Boolean(perms?.includes(PERMISSIONS.WORKFLOW_TEMPLATES_DELETE)) &&
    Boolean(perms?.includes(PERMISSIONS.WORKFLOW_TEMPLATES_UPDATE));

  const { data: template, isLoading, isError, refetch } = useWorkflowTemplate(templateId);
  const { data: roles } = useRoles();
  const { data: departments } = useDepartments();
  const { data: categories } = useFileCategories();

  const { addStep, updateStep, deactivateStep } = useWorkflowStepActions(templateId);
  const updateTemplateMutation = useUpdateOrgEntity({ updateFn: updateWorkflowTemplate, invalidateKeys: INVALIDATE_KEYS });
  const deactivateTemplateMutation = useOrgEntityStatusAction({ actionFn: deactivateWorkflowTemplate, invalidateKeys: INVALIDATE_KEYS });
  const reactivateTemplateMutation = useOrgEntityStatusAction({ actionFn: reactivateWorkflowTemplate, invalidateKeys: INVALIDATE_KEYS });

  const [editTemplateOpen, setEditTemplateOpen] = useState(false);
  const [stepModal, setStepModal] = useState(null); // { mode: "add" | "edit", step? }
  const [deleteStepTarget, setDeleteStepTarget] = useState(null);
  const [toggleStatusOpen, setToggleStatusOpen] = useState(false);

  const roleNameById = useMemo(() => Object.fromEntries((roles ?? []).map((r) => [r.id, r.name])), [roles]);

  const activeSteps = useMemo(
    () => (template?.steps ?? []).filter((s) => s.isActive).sort((a, b) => a.stepOrder - b.stepOrder),
    [template],
  );
  const inactiveSteps = useMemo(() => (template?.steps ?? []).filter((s) => !s.isActive), [template]);
  const nextStepOrder = activeSteps.length ? Math.max(...activeSteps.map((s) => s.stepOrder)) + 1 : 1;

  const categoryName = categories?.find((c) => c.id === template?.categoryId)?.name;
  const departmentName = departments?.find((d) => d.id === template?.departmentId)?.name;

  if (isError) {
    return (
      <div className="p-2 xl:p-4">
        <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center">
          <p className="text-sm text-red-600">Unable to load this workflow template.</p>
          <button type="button" onClick={() => refetch()} className="mt-1.5 text-sm font-semibold text-red-700 hover:underline">
            Try again
          </button>
        </div>
      </div>
    );
  }

  const willDeactivate = template?.isActive;
  const statusMutation = willDeactivate ? deactivateTemplateMutation : reactivateTemplateMutation;

  const runToggleStatus = () => {
    statusMutation.mutate(templateId, {
      onSuccess: () => {
        toast.success(`Template ${willDeactivate ? "deactivated" : "reactivated"}.`);
        setToggleStatusOpen(false);
      },
      onError: (error) => toast.error(error?.response?.data?.message || "Unable to complete this action."),
    });
  };

  const runDeleteStep = () => {
    deactivateStep.mutate(deleteStepTarget.id, {
      onSuccess: () => {
        toast.success(`Step "${deleteStepTarget.name}" removed.`);
        setDeleteStepTarget(null);
      },
      onError: (error) => toast.error(error?.response?.data?.message || "Unable to remove this step."),
    });
  };

  const secondaryActions = canManageStatus && template
    ? [
        {
          label: willDeactivate ? "Deactivate" : "Reactivate",
          icon: willDeactivate ? XCircle : CheckCircle2,
          onClick: () => setToggleStatusOpen(true),
          variant: willDeactivate ? "danger" : "secondary",
        },
      ]
    : [];

  return (
    <div className="p-2 xl:p-4">
      <PageHeader
        title={template?.name ?? "Workflow Template"}
        description={template ? `Code: ${template.code}` : undefined}
        icon={Workflow}
        loading={isLoading}
        badge={template ? { label: template.isActive ? "Active" : "Inactive", tone: template.isActive ? "green" : "amber" } : undefined}
        breadcrumbs={[
          { label: "Dashboard", to: BASE_PATH },
          { label: "Workflow Templates", to: `${BASE_PATH}/workflow-templates` },
          { label: template?.name ?? "Template" },
        ]}
        backTo={`${BASE_PATH}/workflow-templates`}
        secondaryActions={secondaryActions}
        primaryAction={canEdit && template ? { label: "Edit Details", icon: Pencil, onClick: () => setEditTemplateOpen(true) } : undefined}
      />

      {template && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm lg:col-span-1">
            <div className="border-b border-gray-100 px-5 py-4">
              <h3 className="text-sm font-semibold text-gray-800">Overview</h3>
            </div>
            <div className="divide-y divide-gray-100 px-5">
              <InfoRow icon={FileText} label="Description" value={template.description} />
              <InfoRow icon={Tag} label="File Category" value={categoryName} />
              <InfoRow icon={Building2} label="Department" value={departmentName} />
              <InfoRow icon={Workflow} label="Version" value={`v${template.version}`} />
              <InfoRow icon={Clock} label="Created" value={formatDateTime(template.createdAt)} />
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-800">Routing Steps</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Forward moves down this order; return walks back up it to step 1.
                </p>
              </div>
              {canEdit && (
                <button
                  type="button"
                  onClick={() => setStepModal({ mode: "add" })}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-primaryBlue px-4 py-2 text-sm font-semibold text-white hover:bg-primaryBlueDark transition-colors"
                >
                  <Plus size={15} />
                  Add Step
                </button>
              )}
            </div>

            {activeSteps.length >= 2 && (
              <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-gray-600">
                  {activeSteps.map((s, i) => (
                    <span key={s.id} className="inline-flex items-center gap-2">
                      <span className="rounded-lg bg-white px-2 py-1 shadow-sm">{s.name}</span>
                      {i < activeSteps.length - 1 && <ArrowRight size={13} className="text-primaryBlue" />}
                    </span>
                  ))}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-gray-500">
                  {[...activeSteps].reverse().map((s, i) => (
                    <span key={s.id} className="inline-flex items-center gap-2">
                      <span className="rounded-lg bg-white px-2 py-1 shadow-sm">{s.name}</span>
                      {i < activeSteps.length - 1 && <ArrowLeft size={13} className="text-amber-500" />}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {activeSteps.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center">
                <Workflow size={22} className="mx-auto text-gray-300" />
                <p className="mt-2 text-sm font-medium text-gray-700">No steps yet</p>
                <p className="text-xs text-gray-500">Add the first step (e.g. Registry) to start the chain.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeSteps.map((step) => (
                  <StepCard
                    key={step.id}
                    step={step}
                    roleName={roleNameById[step.requiredRoleId]}
                    canEdit={canEdit}
                    canDelete={canEdit}
                    onEdit={(s) => setStepModal({ mode: "edit", step: s })}
                    onDelete={(s) => setDeleteStepTarget(s)}
                  />
                ))}
              </div>
            )}

            {inactiveSteps.length > 0 && (
              <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-3 text-xs text-amber-700">
                {inactiveSteps.length} deactivated step{inactiveSteps.length === 1 ? "" : "s"} hidden. Re-adding a step
                at the same order isn't supported yet -- use a fresh order number.
              </div>
            )}
          </div>
        </div>
      )}

      <EditWorkflowTemplateModal
        entity={editTemplateOpen ? template : null}
        isOpen={editTemplateOpen}
        onClose={() => setEditTemplateOpen(false)}
        mutation={updateTemplateMutation}
      />

      <WorkflowStepFormModal
        isOpen={Boolean(stepModal)}
        onClose={() => setStepModal(null)}
        step={stepModal?.mode === "edit" ? stepModal.step : null}
        nextStepOrder={nextStepOrder}
        addMutation={addStep}
        updateMutation={updateStep}
      />

      <ConfirmDialog
        isOpen={Boolean(deleteStepTarget)}
        onClose={() => setDeleteStepTarget(null)}
        onConfirm={runDeleteStep}
        isPending={deactivateStep.isPending}
        title="Remove Step"
        description={
          deleteStepTarget
            ? `"${deleteStepTarget.name}" (step ${deleteStepTarget.stepOrder}) will be removed from this chain. Files already running on this template are unaffected.`
            : undefined
        }
        confirmLabel="Remove Step"
        icon={Trash2}
        tone="danger"
      />

      <ConfirmDialog
        isOpen={toggleStatusOpen}
        onClose={() => setToggleStatusOpen(false)}
        onConfirm={runToggleStatus}
        isPending={statusMutation.isPending}
        title={willDeactivate ? "Deactivate Template" : "Reactivate Template"}
        description={
          willDeactivate
            ? "It will no longer be selectable when routing a file into a workflow. Files already on it keep running."
            : "It will be selectable again when starting a workflow."
        }
        confirmLabel={willDeactivate ? "Deactivate" : "Reactivate"}
        icon={willDeactivate ? XCircle : CheckCircle2}
        tone={willDeactivate ? "danger" : "primary"}
      />
    </div>
  );
};

export default WorkflowTemplateDetails;
