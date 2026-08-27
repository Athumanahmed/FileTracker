import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Building2, Hash, FileText, Loader2, Save } from "lucide-react";
import Modal from "../shared/Modal";
import BaseInput from "../shared/BaseInput";

// Mirrors server/validators/department.validation.js's updateDepartmentValidationRules
// -- name/code/description are the only editable fields.
const CODE_REGEX = /^[A-Z0-9_-]{2,20}$/;

const editDepartmentSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Department name is required")
    .max(150, "Department name must be at most 150 characters"),
  code: z
    .string()
    .trim()
    .min(1, "Department code is required")
    .regex(CODE_REGEX, "Code must be 2-20 uppercase letters, numbers, hyphens, or underscores"),
  description: z
    .string()
    .trim()
    .max(500, "Description must be at most 500 characters")
    .optional()
    .or(z.literal("")),
});

const EditDepartmentModal = ({ entity, isOpen, onClose, mutation }) => {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(editDepartmentSchema),
    defaultValues: { name: "", code: "", description: "" },
  });

  useEffect(() => {
    if (!entity) return;
    reset({
      name: entity.name || "",
      code: entity.code || "",
      description: entity.description || "",
    });
  }, [entity, reset]);

  const busy = mutation.isPending;

  const onSubmit = (values) => {
    mutation.mutate(
      {
        id: entity.id,
        payload: {
          name: values.name,
          code: values.code,
          description: values.description || "",
        },
      },
      {
        onSuccess: () => {
          toast.success(`Department "${values.name}" was updated.`);
          onClose();
        },
        onError: (error) => {
          toast.error(error?.response?.data?.message || "Unable to update department. Please try again.");
        },
      },
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Department"
      description={entity ? `Update ${entity.name}'s details.` : undefined}
      icon={Building2}
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
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Save size={15} />}
            Save Changes
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <Controller
          name="name"
          control={control}
          render={({ field }) => (
            <BaseInput
              label="Department Name"
              name="name"
              required
              value={field.value}
              onChange={(_, value) => field.onChange(value)}
              leftIcon={<Building2 size={16} />}
              error={errors.name?.message}
              disabled={busy}
            />
          )}
        />
        <Controller
          name="code"
          control={control}
          render={({ field }) => (
            <BaseInput
              label="Department Code"
              name="code"
              required
              value={field.value}
              onChange={(_, value) => field.onChange(value.toUpperCase())}
              leftIcon={<Hash size={16} />}
              error={errors.code?.message}
              helperText={
                errors.code
                  ? undefined
                  : "2-20 characters -- uppercase letters, numbers, hyphens, or underscores."
              }
              disabled={busy}
            />
          )}
        />
        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <BaseInput
              as="textarea"
              rows={4}
              label="Description"
              name="description"
              value={field.value}
              onChange={(_, value) => field.onChange(value)}
              leftIcon={<FileText size={16} />}
              error={errors.description?.message}
              helperText={errors.description ? undefined : `${field.value?.length ?? 0}/500 characters`}
              disabled={busy}
            />
          )}
        />
      </form>
    </Modal>
  );
};

export default EditDepartmentModal;
