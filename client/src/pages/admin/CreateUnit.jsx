import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Boxes, Building2, Hash, FileText, Loader2, Send, RotateCcw, Info } from "lucide-react";
import PageHeader from "../../components/shared/PageHeader";
import BaseInput from "../../components/shared/BaseInput";
import { useDepartments } from "../../hooks/useDepartments";
import { useCreateUnit } from "../../hooks/useCreateUnit";

// Mirrors server/validators/unit.validation.js's CODE_REGEX exactly -- the
// code field is force-uppercased as the user types (see the Controller
// below), so validating against the uppercase-only pattern here matches
// what the backend's customSanitizer would produce from the same input.
const CODE_REGEX = /^[A-Z0-9_-]{2,20}$/;

// Mirrors server/validators/unit.validation.js's createUnitValidationRules
// field-for-field, so nothing that passes here gets rejected server-side.
const createUnitSchema = z.object({
  departmentId: z.string().trim().min(1, "Department is required"),
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

const CreateUnit = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Supports being linked to with a department already in context (e.g. a
  // future "Add Unit" action from a department's own page) while still
  // letting the field be changed freely -- it's a starting value, not a lock.
  const presetDepartmentId = searchParams.get("departmentId") || "";

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(createUnitSchema),
    defaultValues: { departmentId: presetDepartmentId, name: "", code: "", description: "" },
  });

  const { data: departments, isLoading: departmentsLoading, isError: departmentsError } = useDepartments();
  const { mutate: submitCreateUnit, isPending } = useCreateUnit();

  const onSubmit = (formData) => {
    submitCreateUnit(
      { ...formData, description: formData.description || undefined },
      {
        onSuccess: (unit) => {
          toast.success(`Unit "${unit.name}" was created successfully.`);
          navigate("/admin/units");
        },
        onError: (error) => {
          const message = error?.response?.data?.message || "Unable to create unit. Please try again.";
          toast.error(message);
        },
      },
    );
  };

  const busy = isSubmitting || isPending;

  return (
    <div className="p-2 xl:p-4">
      <PageHeader
        title="Add Unit"
        description="Register a new unit under one of the council's departments."
        breadcrumbs={[
          { label: "Dashboard", to: "/admin" },
          { label: "Units", to: "/admin/units" },
          { label: "Add Unit" },
        ]}
        backTo="/admin/units"
      />

      <div className="max-w-2xl rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="flex items-start gap-3 border-b border-gray-100 p-5 sm:p-6">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primaryBlueLight text-primaryBlue">
            <Boxes size={20} />
          </span>
          <div>
            <h2 className="font-bold text-gray-900">Unit Details</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              A unit belongs to exactly one department and cannot be moved after creation.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="p-5 sm:p-6 space-y-5">
          <Controller
            name="departmentId"
            control={control}
            render={({ field }) => (
              <BaseInput
                as="select"
                label="Department"
                name="departmentId"
                required
                value={field.value}
                onChange={(_, value) => field.onChange(value)}
                placeholder={departmentsLoading ? "Loading departments..." : "Select a department"}
                leftIcon={<Building2 size={16} />}
                options={(departments ?? []).map((department) => ({
                  value: department.id,
                  label: department.name,
                }))}
                error={
                  errors.departmentId?.message ||
                  (departmentsError ? "Unable to load departments. Please refresh and try again." : "")
                }
                disabled={busy || departmentsLoading || departmentsError}
              />
            )}
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
                placeholder="e.g. Software Development"
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
                placeholder="e.g. DEV"
                leftIcon={<Hash size={16} />}
                error={errors.code?.message}
                helperText={
                  errors.code
                    ? undefined
                    : "2-20 characters -- uppercase letters, numbers, hyphens, or underscores. Must be unique within the department."
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
                placeholder="Briefly describe this unit's role and responsibilities..."
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
              Once created, the unit is available immediately for assigning users and creating Positions
              under it.
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
              Create Unit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateUnit;
