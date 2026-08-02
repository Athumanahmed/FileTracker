import { useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { KeyRound, Hash, Layers, FileText, Loader2, Send, RotateCcw, Info } from "lucide-react";
import PageHeader from "../../components/shared/PageHeader";
import BaseInput from "../../components/shared/BaseInput";
import { useCreatePermission } from "../../hooks/useCreatePermission";
import { MODULE_OPTIONS } from "../../utils/permissionModules";

// Mirrors server/validators/permission.validation.js's CODE_REGEX exactly --
// note this differs from every other module's code (dots allowed as
// namespace separators, e.g. USERS.CREATE.HOD, up to 100 chars). The code
// field is force-uppercased as the user types (see the Controller below),
// matching what the backend's customSanitizer would produce.
const CODE_REGEX = /^[A-Z0-9_.]{2,100}$/;

// Mirrors server/validators/permission.validation.js's
// createPermissionValidationRules field-for-field, so nothing that passes
// here gets rejected server-side.
const createPermissionSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, "Permission code is required")
    .regex(CODE_REGEX, "Code must be 2-100 uppercase letters, numbers, dots, or underscores"),
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

const defaultValues = { code: "", name: "", module: "", description: "" };

const CreatePermission = () => {
  const navigate = useNavigate();
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(createPermissionSchema),
    defaultValues,
  });

  const { mutate: submitCreatePermission, isPending } = useCreatePermission();

  const onSubmit = (formData) => {
    submitCreatePermission(
      { ...formData, description: formData.description || undefined },
      {
        onSuccess: (permission) => {
          toast.success(`Permission "${permission.name}" was created successfully.`);
          navigate("/admin/permissions");
        },
        onError: (error) => {
          const message = error?.response?.data?.message || "Unable to create permission. Please try again.";
          toast.error(message);
        },
      },
    );
  };

  const busy = isSubmitting || isPending;

  return (
    <div className="p-2 xl:p-4">
      <PageHeader
        title="Add Permission"
        description="Register a new permission that roles can be granted."
        breadcrumbs={[
          { label: "Dashboard", to: "/admin" },
          { label: "Permissions", to: "/admin/permissions" },
          { label: "Add Permission" },
        ]}
        backTo="/admin/permissions"
      />

      <div className="max-w-2xl rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="flex items-start gap-3 border-b border-gray-100 p-5 sm:p-6">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primaryBlueLight text-primaryBlue">
            <KeyRound size={20} />
          </span>
          <div>
            <h2 className="font-bold text-gray-900">Permission Details</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Creating a permission only makes it exist as assignable metadata -- it has no effect until a
              route somewhere actually enforces this exact code.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="p-5 sm:p-6 space-y-5">
          <Controller
            name="code"
            control={control}
            render={({ field }) => (
              <BaseInput
                label="Permission Code"
                name="code"
                required
                value={field.value}
                onChange={(_, value) => field.onChange(value.toUpperCase())}
                placeholder="e.g. REPORTS.EXPORT"
                leftIcon={<Hash size={16} />}
                error={errors.code?.message}
                helperText={
                  errors.code
                    ? undefined
                    : "2-100 characters -- uppercase letters, numbers, dots, or underscores (e.g. USERS.CREATE.HOD). Cannot be changed later."
                }
                disabled={busy}
              />
            )}
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
                placeholder="e.g. Export Reports"
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
                placeholder="Briefly describe what this permission allows..."
                leftIcon={<FileText size={16} />}
                error={errors.description?.message}
                helperText={errors.description ? undefined : `${field.value?.length ?? 0}/500 characters`}
                disabled={busy}
              />
            )}
          />

          <div className="flex items-start gap-2.5 rounded-xl bg-primaryBlueLight px-4 py-3.5">
            <Info className="mt-0.5 shrink-0 text-primaryBlue" size={16} />
            <p className="text-xs leading-relaxed text-gray-600">
              This creates the permission record only. Wiring it into an actual endpoint (via{" "}
              <span className="font-mono text-[11px]">authorize(&quot;{"{code}"}&quot;)</span>) is a separate,
              code-level step -- and it isn't granted to any role yet, so it won't take effect until you
              assign it from Role Permissions.
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
              Create Permission
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePermission;
