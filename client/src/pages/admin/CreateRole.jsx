import { useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { ShieldCheck, Hash, FileText, Loader2, Send, RotateCcw, Info } from "lucide-react";
import PageHeader from "../../components/shared/PageHeader";
import BaseInput from "../../components/shared/BaseInput";
import { useCreateRole } from "../../hooks/useCreateRole";

// Mirrors server/validators/role.validation.js's CODE_REGEX exactly -- note
// this differs from Department/Unit/Position codes (no hyphens, up to 50
// chars, since role codes are plain identifiers like HOD or SUPERVISOR).
// The code field is force-uppercased as the user types (see the Controller
// below), matching what the backend's customSanitizer would produce.
const CODE_REGEX = /^[A-Z0-9_]{2,50}$/;

// Mirrors server/validators/role.validation.js's createRoleValidationRules
// field-for-field, so nothing that passes here gets rejected server-side.
// isSystem is intentionally not part of this form -- it's never
// client-settable (see role.service.js); every role created here is a
// plain custom role.
const createRoleSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Role name is required")
    .max(150, "Role name must be at most 150 characters"),
  code: z
    .string()
    .trim()
    .min(1, "Role code is required")
    .regex(CODE_REGEX, "Code must be 2-50 uppercase letters, numbers, or underscores"),
  description: z
    .string()
    .trim()
    .max(500, "Description must be at most 500 characters")
    .optional()
    .or(z.literal("")),
});

const defaultValues = { name: "", code: "", description: "" };

const CreateRole = () => {
  const navigate = useNavigate();
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(createRoleSchema),
    defaultValues,
  });

  const { mutate: submitCreateRole, isPending } = useCreateRole();

  const onSubmit = (formData) => {
    submitCreateRole(
      { ...formData, description: formData.description || undefined },
      {
        onSuccess: (role) => {
          toast.success(`Role "${role.name}" was created successfully.`);
          navigate("/admin/roles");
        },
        onError: (error) => {
          const message = error?.response?.data?.message || "Unable to create role. Please try again.";
          toast.error(message);
        },
      },
    );
  };

  const busy = isSubmitting || isPending;

  return (
    <div className="p-2 xl:p-4">
      <PageHeader
        title="Add Role"
        description="Register a new custom role for assigning to users."
        breadcrumbs={[
          { label: "Dashboard", to: "/admin" },
          { label: "Roles", to: "/admin/roles" },
          { label: "Add Role" },
        ]}
        backTo="/admin/roles"
      />

      <div className="max-w-2xl rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="flex items-start gap-3 border-b border-gray-100 p-5 sm:p-6">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primaryBlueLight text-primaryBlue">
            <ShieldCheck size={20} />
          </span>
          <div>
            <h2 className="font-bold text-gray-900">Role Details</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Permissions are granted to this role separately from Role Permissions once it's created.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="p-5 sm:p-6 space-y-5">
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
                placeholder="e.g. Records Auditor"
                leftIcon={<ShieldCheck size={16} />}
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
                label="Role Code"
                name="code"
                required
                value={field.value}
                onChange={(_, value) => field.onChange(value.toUpperCase())}
                placeholder="e.g. RECORDS_AUDITOR"
                leftIcon={<Hash size={16} />}
                error={errors.code?.message}
                helperText={
                  errors.code
                    ? undefined
                    : "2-50 characters -- uppercase letters, numbers, or underscores. Cannot be changed later."
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
                placeholder="Briefly describe what this role is for..."
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
              This creates a plain custom role with no permissions yet. Grant it permissions from the Role
              Permissions page, then assign it to users from the Users directory.
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
              Create Role
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateRole;
