import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { ListOrdered, Loader2, Save, Plus } from "lucide-react";
import Modal from "../shared/Modal";
import BaseInput from "../shared/BaseInput";
import { useRoles } from "../../hooks/useRoles";
import { GATED_STEP_ACTIONS, WORKFLOW_ACTION_LABELS } from "../../utils/workflowActions";

// Mirrors server/validators/workflowTemplate.validation.js's
// create/updateStepValidationRules.
const stepSchema = z.object({
  stepOrder: z.coerce.number().int().min(1, "Step order must be 1 or greater"),
  name: z.string().trim().min(1, "Step name is required").max(150, "Name must be at most 150 characters"),
  description: z.string().trim().max(500, "Description must be at most 500 characters").optional().or(z.literal("")),
  requiredRoleId: z.string().optional().or(z.literal("")),
  slaHours: z
    .union([z.literal(""), z.coerce.number().int().min(1, "SLA must be at least 1 hour")])
    .optional(),
  isFinalStep: z.boolean(),
  allowedActions: z.array(z.string()),
});

const DEFAULTS = {
  stepOrder: 1,
  name: "",
  description: "",
  requiredRoleId: "",
  slaHours: "",
  isFinalStep: false,
  allowedActions: [],
};

/**
 * Add / edit a single WorkflowStep. `step` null => add mode (stepOrder
 * editable, prefilled to `nextStepOrder`); `step` set => edit mode
 * (stepOrder locked -- the API has no reorder operation).
 */
const WorkflowStepFormModal = ({ isOpen, onClose, step, nextStepOrder = 1, addMutation, updateMutation }) => {
  const isEdit = Boolean(step);
  const mutation = isEdit ? updateMutation : addMutation;
  const busy = mutation.isPending;
  const { data: roles } = useRoles();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(stepSchema), defaultValues: DEFAULTS });

  useEffect(() => {
    if (!isOpen) return;
    reset(
      isEdit
        ? {
            stepOrder: step.stepOrder,
            name: step.name || "",
            description: step.description || "",
            requiredRoleId: step.requiredRoleId || "",
            slaHours: step.slaHours ?? "",
            isFinalStep: Boolean(step.isFinalStep),
            allowedActions: step.allowedActions ?? [],
          }
        : { ...DEFAULTS, stepOrder: nextStepOrder },
    );
  }, [isOpen, isEdit, step, nextStepOrder, reset]);

  const roleOptions = [
    { value: "", label: "Anyone (no role requirement)" },
    ...(roles ?? []).map((r) => ({ value: r.id, label: r.name })),
  ];

  const onSubmit = (values) => {
    const payload = {
      name: values.name,
      description: values.description || "",
      requiredRoleId: values.requiredRoleId || "",
      // null (not "") when blank -- the server stores this straight into an
      // Int column and only treats null/undefined as "no SLA".
      slaHours: values.slaHours === "" || values.slaHours === undefined ? null : Number(values.slaHours),
      isFinalStep: values.isFinalStep,
      allowedActions: values.allowedActions,
    };

    const onError = (error) =>
      toast.error(error?.response?.data?.message || `Unable to ${isEdit ? "update" : "add"} step.`);

    if (isEdit) {
      updateMutation.mutate(
        { stepId: step.id, payload },
        {
          onSuccess: () => {
            toast.success(`Step "${values.name}" updated.`);
            onClose();
          },
          onError,
        },
      );
    } else {
      addMutation.mutate(
        { ...payload, stepOrder: Number(values.stepOrder) },
        {
          onSuccess: () => {
            toast.success(`Step "${values.name}" added.`);
            onClose();
          },
          onError,
        },
      );
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? `Edit Step ${step.stepOrder}` : "Add Step"}
      description={
        isEdit
          ? "Update this step's requirements. Its position in the chain can't be changed here."
          : "Add the next step in this routing chain."
      }
      icon={ListOrdered}
      size="lg"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit(onSubmit)}
            disabled={busy}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primaryBlue px-4 py-2.5 text-sm font-semibold text-white hover:bg-primaryBlueDark transition-colors disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? <Loader2 size={16} className="animate-spin" /> : isEdit ? <Save size={15} /> : <Plus size={15} />}
            {isEdit ? "Save Changes" : "Add Step"}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Controller
            name="stepOrder"
            control={control}
            render={({ field }) => (
              <BaseInput
                type="number"
                label="Step Order"
                name="stepOrder"
                required
                value={field.value}
                onChange={(_, value) => field.onChange(value)}
                error={errors.stepOrder?.message}
                disabled={busy || isEdit}
                helperText={isEdit ? "Fixed once created." : "1 = first to hold the file."}
                min={1}
              />
            )}
          />
          <Controller
            name="slaHours"
            control={control}
            render={({ field }) => (
              <BaseInput
                type="number"
                label="SLA (hours)"
                name="slaHours"
                value={field.value}
                onChange={(_, value) => field.onChange(value)}
                error={errors.slaHours?.message}
                disabled={busy}
                placeholder="e.g. 48"
                helperText="Optional -- due date for whoever holds this step."
                min={1}
              />
            )}
          />
        </div>

        <Controller
          name="name"
          control={control}
          render={({ field }) => (
            <BaseInput
              label="Step Name"
              name="name"
              required
              value={field.value}
              onChange={(_, value) => field.onChange(value)}
              placeholder="e.g. Director Review"
              error={errors.name?.message}
              disabled={busy}
            />
          )}
        />

        <Controller
          name="requiredRoleId"
          control={control}
          render={({ field }) => (
            <BaseInput
              as="select"
              label="Required Role"
              name="requiredRoleId"
              value={field.value}
              onChange={(_, value) => field.onChange(value)}
              options={roleOptions}
              disabled={busy}
              helperText="Only users holding this role can receive the file at this step."
            />
          )}
        />

        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <BaseInput
              as="textarea"
              rows={2}
              label="Description"
              name="description"
              value={field.value}
              onChange={(_, value) => field.onChange(value)}
              error={errors.description?.message}
              disabled={busy}
            />
          )}
        />

        <Controller
          name="allowedActions"
          control={control}
          render={({ field }) => (
            <div>
              <span className="block text-sm font-medium text-gray-700 mb-1.5">Allowed Actions</span>
              <div className="grid grid-cols-2 gap-2">
                {GATED_STEP_ACTIONS.map((action) => {
                  const checked = field.value.includes(action);
                  return (
                    <label
                      key={action}
                      className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        className="size-4 rounded border-gray-300 text-primaryBlue focus:ring-primaryBlue/30"
                        checked={checked}
                        disabled={busy}
                        onChange={(e) =>
                          field.onChange(
                            e.target.checked
                              ? [...field.value, action]
                              : field.value.filter((a) => a !== action),
                          )
                        }
                      />
                      {WORKFLOW_ACTION_LABELS[action]}
                    </label>
                  );
                })}
              </div>
              <p className="text-xs text-gray-400 mt-1.5">
                Leave all unchecked to allow every action. Hold, Resume, Complete and Close are always available.
              </p>
            </div>
          )}
        />

        <Controller
          name="isFinalStep"
          control={control}
          render={({ field }) => (
            <label className="flex items-start gap-2.5 rounded-xl bg-primaryBlueLight px-4 py-3 cursor-pointer">
              <input
                type="checkbox"
                className="mt-0.5 size-4 rounded border-gray-300 text-primaryBlue focus:ring-primaryBlue/30"
                checked={field.value}
                disabled={busy}
                onChange={(e) => field.onChange(e.target.checked)}
              />
              <span className="text-xs leading-relaxed text-gray-600">
                <span className="font-semibold text-gray-800">Final step.</span> Forwarding is disabled here; an
                Approve at this step completes the whole workflow. The file can still be returned to an earlier step.
              </span>
            </label>
          )}
        />
      </form>
    </Modal>
  );
};

export default WorkflowStepFormModal;
