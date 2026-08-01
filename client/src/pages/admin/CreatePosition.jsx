import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { IdCard, Building2, Boxes, Hash, Layers, FileText, Crown, Loader2, Send, RotateCcw, Info } from "lucide-react";
import PageHeader from "../../components/shared/PageHeader";
import BaseInput from "../../components/shared/BaseInput";
import { useDepartments } from "../../hooks/useDepartments";
import { useUnits } from "../../hooks/useUnits";
import { useCreatePosition } from "../../hooks/useCreatePosition";

// Mirrors server/validators/position.validation.js's CODE_REGEX exactly --
// the code field is force-uppercased as the user types (see the Controller
// below), so validating against the uppercase-only pattern here matches
// what the backend's customSanitizer would produce from the same input.
const CODE_REGEX = /^[A-Z0-9_-]{2,20}$/;

const POSITION_TYPE_OPTIONS = [
  { value: "EXECUTIVE", label: "Executive" },
  { value: "MANAGEMENT", label: "Management" },
  { value: "SUPERVISORY", label: "Supervisory" },
  { value: "OPERATIONAL", label: "Operational" },
  { value: "SUPPORT", label: "Support" },
];

// Mirrors server/validators/position.validation.js's
// createPositionValidationRules field-for-field, so nothing that passes
// here gets rejected server-side. departmentId is intentionally NOT part
// of this schema -- it's local UI state that only narrows the Unit
// dropdown (see below); the actual payload only ever carries unitId.
const createPositionSchema = z.object({
  unitId: z.string().trim().min(1, "Unit is required"),
  title: z
    .string()
    .trim()
    .min(1, "Position title is required")
    .max(150, "Position title must be at most 150 characters"),
  code: z
    .string()
    .trim()
    .min(1, "Position code is required")
    .regex(CODE_REGEX, "Code must be 2-20 uppercase letters, numbers, hyphens, or underscores"),
  rank: z.coerce
    .number({ invalid_type_error: "Rank is required" })
    .int("Rank must be a whole number")
    .min(1, "Rank must be between 1 and 100")
    .max(100, "Rank must be between 1 and 100"),
  positionType: z.string().trim().min(1, "Position type is required"),
  description: z
    .string()
    .trim()
    .max(500, "Description must be at most 500 characters")
    .optional()
    .or(z.literal("")),
  isHead: z.boolean().optional(),
});

const defaultValues = {
  unitId: "",
  title: "",
  code: "",
  rank: "",
  positionType: "",
  description: "",
  isHead: false,
};

const CreatePosition = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Supports being linked to with a unit already in context (e.g. a future
  // "Add Position" action from a unit's own page). Department is derived
  // from it below once units load, since departmentId itself isn't in the URL.
  const presetUnitId = searchParams.get("unitId") || "";

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(createPositionSchema),
    defaultValues: { ...defaultValues, unitId: presetUnitId },
  });

  const [departmentId, setDepartmentId] = useState("");

  const { data: departments, isLoading: departmentsLoading, isError: departmentsError } = useDepartments();
  const { data: units, isLoading: unitsLoading, isError: unitsError } = useUnits(departmentId);
  const { mutate: submitCreatePosition, isPending } = useCreatePosition();

  const handleDepartmentChange = (value) => {
    setDepartmentId(value);
    // A unit only belongs to one department -- clear the previously chosen
    // unit whenever the department changes so the two can never disagree.
    setValue("unitId", "");
  };

  const onSubmit = (formData) => {
    const { isHead, description, ...rest } = formData;
    submitCreatePosition(
      { ...rest, description: description || undefined, isHead: Boolean(isHead) },
      {
        onSuccess: (position) => {
          toast.success(`Position "${position.title}" was created successfully.`);
          navigate("/admin/positions");
        },
        onError: (error) => {
          const message = error?.response?.data?.message || "Unable to create position. Please try again.";
          toast.error(message);
        },
      },
    );
  };

  const busy = isSubmitting || isPending;

  return (
    <div className="p-2 xl:p-4">
      <PageHeader
        title="Add Position"
        description="Register a new position under one of the council's units."
        breadcrumbs={[
          { label: "Dashboard", to: "/admin" },
          { label: "Positions", to: "/admin/positions" },
          { label: "Add Position" },
        ]}
        backTo="/admin/positions"
      />

      <div className="max-w-2xl rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="flex items-start gap-3 border-b border-gray-100 p-5 sm:p-6">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primaryBlueLight text-primaryBlue">
            <IdCard size={20} />
          </span>
          <div>
            <h2 className="font-bold text-gray-900">Position Details</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              A position belongs to exactly one unit and cannot be moved after creation.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="p-5 sm:p-6 space-y-6">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">
              Organizational Assignment
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <BaseInput
                as="select"
                label="Department"
                name="departmentId"
                required
                value={departmentId}
                onChange={(_, value) => handleDepartmentChange(value)}
                placeholder={departmentsLoading ? "Loading departments..." : "Select a department"}
                leftIcon={<Building2 size={16} />}
                options={(departments ?? []).map((department) => ({
                  value: department.id,
                  label: department.name,
                }))}
                error={departmentsError ? "Unable to load departments. Please refresh and try again." : ""}
                disabled={busy || departmentsLoading || departmentsError}
              />

              <Controller
                name="unitId"
                control={control}
                render={({ field }) => (
                  <BaseInput
                    as="select"
                    label="Unit"
                    name="unitId"
                    required
                    value={field.value}
                    onChange={(_, value) => field.onChange(value)}
                    placeholder={
                      !departmentId
                        ? "Select a department first"
                        : unitsLoading
                          ? "Loading units..."
                          : "Select a unit"
                    }
                    leftIcon={<Boxes size={16} />}
                    options={(units ?? []).map((unit) => ({ value: unit.id, label: unit.name }))}
                    error={
                      errors.unitId?.message ||
                      (unitsError ? "Unable to load units. Please refresh and try again." : "")
                    }
                    disabled={busy || !departmentId || unitsLoading || unitsError}
                  />
                )}
              />
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">
              Position Details
            </h3>
            <div className="space-y-4">
              <Controller
                name="title"
                control={control}
                render={({ field }) => (
                  <BaseInput
                    label="Position Title"
                    name="title"
                    required
                    value={field.value}
                    onChange={(_, value) => field.onChange(value)}
                    placeholder="e.g. Software Engineer"
                    leftIcon={<IdCard size={16} />}
                    error={errors.title?.message}
                    disabled={busy}
                  />
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Controller
                  name="code"
                  control={control}
                  render={({ field }) => (
                    <BaseInput
                      label="Position Code"
                      name="code"
                      required
                      value={field.value}
                      onChange={(_, value) => field.onChange(value.toUpperCase())}
                      placeholder="e.g. SE"
                      leftIcon={<Hash size={16} />}
                      error={errors.code?.message}
                      helperText={errors.code ? undefined : "2-20 characters, unique within the unit."}
                      disabled={busy}
                    />
                  )}
                />

                <Controller
                  name="rank"
                  control={control}
                  render={({ field }) => (
                    <BaseInput
                      type="number"
                      label="Rank"
                      name="rank"
                      required
                      value={field.value}
                      onChange={(_, value) => field.onChange(value)}
                      placeholder="e.g. 5"
                      min={1}
                      max={100}
                      leftIcon={<Layers size={16} />}
                      error={errors.rank?.message}
                      helperText={errors.rank ? undefined : "1 (highest) to 100 (lowest) -- used for hierarchy ordering."}
                      disabled={busy}
                    />
                  )}
                />
              </div>

              <Controller
                name="positionType"
                control={control}
                render={({ field }) => (
                  <BaseInput
                    as="select"
                    label="Position Type"
                    name="positionType"
                    required
                    value={field.value}
                    onChange={(_, value) => field.onChange(value)}
                    placeholder="Select a position type"
                    leftIcon={<Layers size={16} />}
                    options={POSITION_TYPE_OPTIONS}
                    error={errors.positionType?.message}
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
                    placeholder="Briefly describe this position's role and responsibilities..."
                    leftIcon={<FileText size={16} />}
                    error={errors.description?.message}
                    helperText={errors.description ? undefined : `${field.value?.length ?? 0}/500 characters`}
                    disabled={busy}
                  />
                )}
              />

              <Controller
                name="isHead"
                control={control}
                render={({ field }) => (
                  <label className="flex items-start gap-3 rounded-xl border border-gray-200 px-4 py-3.5 cursor-pointer hover:bg-gray-50 transition-colors has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60">
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                      disabled={busy}
                      className="mt-0.5 size-4 rounded border-gray-300 text-primaryBlue focus:ring-primaryBlue/30"
                    />
                    <span>
                      <span className="flex items-center gap-1.5 text-sm font-medium text-gray-800">
                        <Crown size={14} className="text-goldAccent" />
                        Head of Unit
                      </span>
                      <span className="block text-xs text-gray-500 mt-0.5">
                        Marks this as the unit's head position. Only one active head position is allowed per
                        unit.
                      </span>
                    </span>
                  </label>
                )}
              />
            </div>
          </div>

          <div className="flex items-start gap-2.5 rounded-xl bg-primaryBlueLight px-4 py-3.5">
            <Info className="mt-0.5 shrink-0 text-primaryBlue" size={16} />
            <p className="text-xs leading-relaxed text-gray-600">
              Once created, the position is available immediately for assigning a user during their account
              creation.
            </p>
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={() => {
                reset();
                setDepartmentId("");
              }}
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
              Create Position
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePosition;
