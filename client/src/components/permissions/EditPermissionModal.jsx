import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { KeyRound, Hash, Layers, FileText, Loader2, Save } from "lucide-react";
import Modal from "../shared/Modal";
import BaseInput from "../shared/BaseInput";
import { MODULE_OPTIONS } from "../../utils/permissionModules";

// Mirrors server/validators/permission.validation.js's updatePermissionValidationRules --
// code is immutable after creation; name/module/description are editable.
const editPermissionSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Permission name is required")
    .max(150, "Permission name must be at most 150 characters"),
  module: z.string().trim().min(1, "Module is required"),
  description: z
    .string()
    .trim()
    .max(500, "Description must be at most 500 characters")
    .optional()
    .or(z.literal("")),
});

const EditPermissionModal = ({ entity, isOpen, onClose, mutation }) => {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(editPermissionSchema),
    defaultValues: { name: "", module: "", description: "" },
  });

  useEffect(() => {
    if (!entity) return;
    reset({
      name: entity.name || "",
      module: entity.module || "",
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
          module: values.module,
          description: values.description || "",
        },
      },
      {
        onSuccess: () => {
          toast.success(`Permission "${values.name}" was updated.`);
          onClose();
        },
        onError: (error) => {
          toast.error(error?.response?.data?.message || "Unable to update permission. Please try again.");
        },
      },
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Permission"
      description={entity ? `Update ${entity.name}'s details.` : undefined}
      icon={KeyRound}
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
          label="Permission Code"
          name="code"
          value={entity?.code || "—"}
          onChange={() => {}}
          leftIcon={<Hash size={16} />}
          disabled
          helperText="The permission code is referenced by authorize() calls in code and cannot be changed."
        />
        <Controller
          name="name"
          control={control}
          render={({ field }) => (
            <BaseInput
              label="Permission Name"
              name="name"
              required
              value={field.value}
              onChange={(_, value) => field.onChange(value)}
              leftIcon={<KeyRound size={16} />}
              error={errors.name?.message}
              disabled={busy}
            />
          )}
        />
        <Controller
          name="module"
          control={control}
          render={({ field }) => (
            <BaseInput
              as="select"
              label="Module"
              name="module"
              required
              value={field.value}
              onChange={(_, value) => field.onChange(value)}
              placeholder="Select a module"
              leftIcon={<Layers size={16} />}
              options={MODULE_OPTIONS}
              error={errors.module?.message}
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

export default EditPermissionModal;
