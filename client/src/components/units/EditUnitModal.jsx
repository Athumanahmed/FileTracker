import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Boxes, Building2, Hash, FileText, Loader2, Save } from "lucide-react";
import Modal from "../shared/Modal";
import BaseInput from "../shared/BaseInput";

// Mirrors server/validators/unit.validation.js's updateUnitValidationRules --
// departmentId is immutable after creation, so it's shown read-only here.
const CODE_REGEX = /^[A-Z0-9_-]{2,20}$/;

const editUnitSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Unit name is required")
    .max(150, "Unit name must be at most 150 characters"),
  code: z
    .string()
    .trim()
    .min(1, "Unit code is required")
    .regex(CODE_REGEX, "Code must be 2-20 uppercase letters, numbers, hyphens, or underscores"),
  description: z
    .string()
    .trim()
    .max(500, "Description must be at most 500 characters")
    .optional()
    .or(z.literal("")),
});

const EditUnitModal = ({ entity, isOpen, onClose, mutation }) => {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(editUnitSchema),
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
          toast.success(`Unit "${values.name}" was updated.`);
          onClose();
        },
        onError: (error) => {
          toast.error(error?.response?.data?.message || "Unable to update unit. Please try again.");
        },
      },
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Unit"
      description={entity ? `Update ${entity.name}'s details.` : undefined}
      icon={Boxes}
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
        <BaseInput
          label="Department"
          name="department"
          value={entity?.department?.name || "—"}
          onChange={() => {}}
          leftIcon={<Building2 size={16} />}
          disabled
          helperText="A unit cannot be moved between departments after creation."
        />
        <Controller
          name="name"
          control={control}
          render={({ field }) => (
            <BaseInput
              label="Unit Name"
              name="name"
              required
              value={field.value}
              onChange={(_, value) => field.onChange(value)}
              leftIcon={<Boxes size={16} />}
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
              label="Unit Code"
              name="code"
              required
              value={field.value}
              onChange={(_, value) => field.onChange(value.toUpperCase())}
              leftIcon={<Hash size={16} />}
              error={errors.code?.message}
              helperText={
                errors.code
                  ? undefined
                  : "2-20 characters -- must be unique within the department."
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

export default EditUnitModal;
