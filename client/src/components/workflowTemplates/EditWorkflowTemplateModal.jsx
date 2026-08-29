import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Workflow, FileText, Loader2, Save } from "lucide-react";
import Modal from "../shared/Modal";
import BaseInput from "../shared/BaseInput";
import { useDepartments } from "../../hooks/useDepartments";
import { useFileCategories } from "../../hooks/useFileCategories";

// Mirrors server/validators/workflowTemplate.validation.js's
// updateTemplateValidationRules -- code is immutable after creation, so it
// isn't editable here.
const editTemplateSchema = z.object({
  name: z.string().trim().min(1, "Template name is required").max(150, "Name must be at most 150 characters"),
  description: z.string().trim().max(500, "Description must be at most 500 characters").optional().or(z.literal("")),
  categoryId: z.string().optional().or(z.literal("")),
  departmentId: z.string().optional().or(z.literal("")),
});

const EditWorkflowTemplateModal = ({ entity, isOpen, onClose, mutation }) => {
  const { data: departments } = useDepartments();
  const { data: categories } = useFileCategories();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(editTemplateSchema),
    defaultValues: { name: "", description: "", categoryId: "", departmentId: "" },
  });

  useEffect(() => {
    if (!entity) return;
    reset({
      name: entity.name || "",
      description: entity.description || "",
      categoryId: entity.categoryId || "",
      departmentId: entity.departmentId || "",
    });
  }, [entity, reset]);

  const busy = mutation.isPending;

  const categoryOptions = [
    { value: "", label: "Any category" },
    ...(categories ?? []).map((c) => ({ value: c.id, label: c.name })),
  ];
  const departmentOptions = [
    { value: "", label: "Any department" },
    ...(departments ?? []).map((d) => ({ value: d.id, label: d.name })),
  ];

  const onSubmit = (values) => {
    mutation.mutate(
      {
        id: entity.id,
        payload: {
          name: values.name,
          description: values.description || "",
          categoryId: values.categoryId || "",
          departmentId: values.departmentId || "",
        },
      },
      {
        onSuccess: () => {
          toast.success(`Template "${values.name}" was updated.`);
          onClose();
        },
        onError: (error) => {
          toast.error(error?.response?.data?.message || "Unable to update template. Please try again.");
        },
      },
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Workflow Template"
      description={entity ? `Update ${entity.name}'s details. Its code (${entity.code}) can't be changed.` : undefined}
      icon={Workflow}
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
              label="Template Name"
              name="name"
              required
              value={field.value}
              onChange={(_, value) => field.onChange(value)}
              leftIcon={<Workflow size={16} />}
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
              rows={3}
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
        <div className="grid gap-4 sm:grid-cols-2">
          <Controller
            name="categoryId"
            control={control}
            render={({ field }) => (
              <BaseInput
                as="select"
                label="File Category"
                name="categoryId"
                value={field.value}
                onChange={(_, value) => field.onChange(value)}
                options={categoryOptions}
                disabled={busy}
                helperText="Optional -- narrows which files this template suits."
              />
            )}
          />
          <Controller
            name="departmentId"
            control={control}
            render={({ field }) => (
              <BaseInput
                as="select"
                label="Department"
                name="departmentId"
                value={field.value}
                onChange={(_, value) => field.onChange(value)}
                options={departmentOptions}
                disabled={busy}
                helperText="Optional -- scopes this template to one department."
              />
            )}
          />
        </div>
      </form>
    </Modal>
  );
};

export default EditWorkflowTemplateModal;
