import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { ShieldCheck, Hash, FileText, Loader2, Save } from "lucide-react";
import Modal from "../shared/Modal";
import BaseInput from "../shared/BaseInput";

// Mirrors server/validators/role.validation.js's updateRoleValidationRules --
// code and isSystem are immutable after creation, so only name/description
// are editable. code is shown read-only for context.
const editRoleSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Role name is required")
    .max(150, "Role name must be at most 150 characters"),
  description: z
    .string()
    .trim()
    .max(500, "Description must be at most 500 characters")
    .optional()
    .or(z.literal("")),
});

const EditRoleModal = ({ entity, isOpen, onClose, mutation }) => {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(editRoleSchema),
    defaultValues: { name: "", description: "" },
  });

  useEffect(() => {
    if (!entity) return;
    reset({
      name: entity.name || "",
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
          description: values.description || "",
        },
      },
      {
        onSuccess: () => {
          toast.success(`Role "${values.name}" was updated.`);
          onClose();
        },
        onError: (error) => {
          toast.error(error?.response?.data?.message || "Unable to update role. Please try again.");
        },
      },
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Role"
      description={entity ? `Update ${entity.name}'s details.` : undefined}
      icon={ShieldCheck}
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
          label="Role Code"
          name="code"
          value={entity?.code || "—"}
          onChange={() => {}}
          leftIcon={<Hash size={16} />}
          disabled
          helperText="The role code cannot be changed after creation."
        />
        <Controller
          name="name"
          control={control}
          render={({ field }) => (
            <BaseInput
              label="Role Name"
              name="name"
              required
              value={field.value}
              onChange={(_, value) => field.onChange(value)}
              leftIcon={<ShieldCheck size={16} />}
              error={errors.name?.message}
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

export default EditRoleModal;
