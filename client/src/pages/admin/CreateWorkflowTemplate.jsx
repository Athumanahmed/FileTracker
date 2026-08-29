import { useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Workflow, Hash, FileText, Loader2, Send, RotateCcw, Info } from "lucide-react";
import PageHeader from "../../components/shared/PageHeader";
import BaseInput from "../../components/shared/BaseInput";
import { useCreateWorkflowTemplate } from "../../hooks/useCreateWorkflowTemplate";
import { useDepartments } from "../../hooks/useDepartments";
import { useFileCategories } from "../../hooks/useFileCategories";

const BASE_PATH = "/admin";

// Mirrors server/validators/workflowTemplate.validation.js's CODE_REGEX
// (the code field is force-uppercased as the user types).
const CODE_REGEX = /^[A-Z0-9_-]{2,30}$/;

const createTemplateSchema = z.object({
  name: z.string().trim().min(1, "Template name is required").max(150, "Name must be at most 150 characters"),
  code: z
    .string()
    .trim()
    .min(1, "Template code is required")
    .regex(CODE_REGEX, "Code must be 2-30 uppercase letters, numbers, hyphens, or underscores"),
  description: z.string().trim().max(500, "Description must be at most 500 characters").optional().or(z.literal("")),
  categoryId: z.string().optional().or(z.literal("")),
  departmentId: z.string().optional().or(z.literal("")),
});

const defaultValues = { name: "", code: "", description: "", categoryId: "", departmentId: "" };

const CreateWorkflowTemplate = () => {
  const navigate = useNavigate();
  const { data: departments } = useDepartments();
  const { data: categories } = useFileCategories();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(createTemplateSchema), defaultValues });

  const { mutate: submitCreate, isPending } = useCreateWorkflowTemplate();
  const busy = isSubmitting || isPending;

  const categoryOptions = [
    { value: "", label: "Any category" },
    ...(categories ?? []).map((c) => ({ value: c.id, label: c.name })),
  ];
  const departmentOptions = [
    { value: "", label: "Any department" },
    ...(departments ?? []).map((d) => ({ value: d.id, label: d.name })),
  ];

  const onSubmit = (formData) => {
    submitCreate(
      {
        name: formData.name,
        code: formData.code,
        description: formData.description || undefined,
        categoryId: formData.categoryId || undefined,
        departmentId: formData.departmentId || undefined,
      },
      {
        onSuccess: (template) => {
          toast.success(`Template "${template.name}" created. Now add its steps.`);
          navigate(`${BASE_PATH}/workflow-templates/${template.id}`);
        },
        onError: (error) => {
          toast.error(error?.response?.data?.message || "Unable to create template. Please try again.");
        },
      },
    );
  };

  return (
    <div className="p-2 xl:p-4">
      <PageHeader
        title="Add Workflow Template"
        description="Create the template, then configure its ordered steps on the next screen."
        breadcrumbs={[
          { label: "Dashboard", to: BASE_PATH },
          { label: "Workflow Templates", to: `${BASE_PATH}/workflow-templates` },
          { label: "Add Template" },
        ]}
        backTo={`${BASE_PATH}/workflow-templates`}
      />

      <div className="max-w-2xl rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="flex items-start gap-3 border-b border-gray-100 p-5 sm:p-6">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primaryBlueLight text-primaryBlue">
            <Workflow size={20} />
          </span>
          <div>
            <h2 className="font-bold text-gray-900">Template Details</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              A template groups an ordered chain of steps. Files are forwarded down the chain and can be returned
              back up it.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="p-5 sm:p-6 space-y-5">
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
                placeholder="e.g. Registry - Director - HOD - Supervisor Routing"
                leftIcon={<Workflow size={16} />}
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
                label="Template Code"
                name="code"
                required
                value={field.value}
                onChange={(_, value) => field.onChange(value.toUpperCase())}
                placeholder="e.g. REG_DIR_HOD_SUP"
                leftIcon={<Hash size={16} />}
                error={errors.code?.message}
                helperText={errors.code ? undefined : "2-30 characters -- uppercase letters, numbers, hyphens, or underscores. Can't be changed later."}
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
                placeholder="When should this template be used?"
                leftIcon={<FileText size={16} />}
                error={errors.description?.message}
                helperText={errors.description ? undefined : `${field.value?.length ?? 0}/500 characters`}
                disabled={busy}
              />
            )}
          />

          <div className="grid gap-5 sm:grid-cols-2">
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
                  helperText="Optional"
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
                  helperText="Optional"
                />
              )}
            />
          </div>

          <div className="flex items-start gap-2.5 rounded-xl bg-primaryBlueLight px-4 py-3.5">
            <Info className="mt-0.5 shrink-0 text-primaryBlue" size={16} />
            <p className="text-xs leading-relaxed text-gray-600">
              After creating it, you'll add steps in order (e.g. Registry, then Director, then HOD, then
              Supervisor). A file forwards down that order and can be returned back up it to the first step.
            </p>
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={() => reset()}
              disabled={busy}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RotateCcw size={15} />
              Clear Form
            </button>
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primaryBlue px-5 py-2.5 text-sm font-semibold text-white hover:bg-primaryBlueDark transition-colors disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              Create Template
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateWorkflowTemplate;
