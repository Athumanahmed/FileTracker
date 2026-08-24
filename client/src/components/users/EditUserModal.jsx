import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { AtSign, Phone, Building2, Users2, IdCard, Loader2, Save } from "lucide-react";
import Modal from "../shared/Modal";
import BaseInput from "../shared/BaseInput";
import { useAdminUserDetail } from "../../hooks/useAdminUserDetail";
import { useUpdateAdminUser } from "../../hooks/useUpdateAdminUser";
import { useDepartments } from "../../hooks/useDepartments";
import { useUnits } from "../../hooks/useUnits";
import { usePositions } from "../../hooks/usePositions";

// Mirrors server/services/phone.service.js's normalizePhoneNumber acceptance rules.
const TZ_PHONE_REGEX = /^(\+255|255|0)[67]\d{8}$/;

const editUserSchema = z.object({
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email address"),
  phoneNumber: z
    .string()
    .trim()
    .min(1, "Phone number is required")
    .regex(TZ_PHONE_REGEX, "Enter a valid Tanzanian phone number (e.g. 0712345678)"),
  departmentId: z.string().trim().optional(),
  unitId: z.string().trim().optional(),
  positionId: z.string().trim().optional(),
});

const defaultValues = { email: "", phoneNumber: "", departmentId: "", unitId: "", positionId: "" };

/**
 * department is only clearable server-side by not changing it at all (see
 * adminUserUpdate.service.js's resolveOrganizationalFields -- unlike
 * unit/position, there's no null-clear branch for department), so a blank
 * selection falls back to the user's current department rather than being
 * sent as a clear request that the API would reject.
 */
const EditUserModal = ({ userId, isOpen, onClose }) => {
  const { data: user, isLoading, isError } = useAdminUserDetail(isOpen ? userId : null);
  const { mutate: submitUpdate, isPending } = useUpdateAdminUser();

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(editUserSchema), defaultValues });

  useEffect(() => {
    if (!user) return;
    reset({
      email: user.email || "",
      phoneNumber: user.phoneNumber || "",
      departmentId: user.department?.id || "",
      unitId: user.unit?.id || "",
      positionId: user.position?.id || "",
    });
  }, [user, reset]);

  const departmentId = watch("departmentId");
  const unitId = watch("unitId");

  const { data: departments, isLoading: departmentsLoading, isError: departmentsError } = useDepartments();
  const { data: units, isLoading: unitsLoading } = useUnits(departmentId);
  const { data: positions, isLoading: positionsLoading } = usePositions(unitId);

  // Cascading resets -- changing the parent invalidates whatever child was
  // selected under the previous parent (mirrors CreateHoD/CreateSupervisor's
  // own cascading dropdowns elsewhere in this module).
  const handleDepartmentChange = (name, value) => {
    setValue("departmentId", value);
    if (value !== user?.department?.id) {
      setValue("unitId", "");
      setValue("positionId", "");
    }
  };

  const handleUnitChange = (name, value) => {
    setValue("unitId", value);
    if (value !== user?.unit?.id) {
      setValue("positionId", "");
    }
  };

  const onSubmit = (values) => {
    if (!user) return;
    const payload = {
      email: values.email,
      phoneNumber: values.phoneNumber,
      departmentId: values.departmentId || user.department?.id || null,
      unitId: values.unitId || null,
      positionId: values.positionId || null,
    };

    submitUpdate(
      { userId, payload },
      {
        onSuccess: () => {
          toast.success("User updated successfully.");
          onClose();
        },
        onError: (error) => {
          toast.error(error?.response?.data?.message || "Unable to update user. Please try again.");
        },
      },
    );
  };

  const busy = isPending;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit User"
      description={user ? `Update ${user.fullName || user.username}'s contact and organizational details.` : undefined}
      size="lg"
      footer={
        !isLoading && !isError ? (
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
        ) : undefined
      }
    >
      {isLoading ? (
        <div className="py-10 text-center text-sm text-gray-500">Loading user details...</div>
      ) : isError ? (
        <div className="py-10 text-center text-sm text-red-600">Unable to load this user. Please try again.</div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <BaseInput
                  label="Email Address"
                  name="email"
                  type="email"
                  required
                  value={field.value}
                  onChange={(_, value) => field.onChange(value)}
                  leftIcon={<AtSign size={16} />}
                  error={errors.email?.message}
                  disabled={busy}
                />
              )}
            />
            <Controller
              name="phoneNumber"
              control={control}
              render={({ field }) => (
                <BaseInput
                  label="Phone Number"
                  name="phoneNumber"
                  required
                  value={field.value}
                  onChange={(_, value) => field.onChange(value)}
                  placeholder="e.g. 0712345678"
                  leftIcon={<Phone size={16} />}
                  error={errors.phoneNumber?.message}
                  disabled={busy}
                />
              )}
            />
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">
              Organizational Assignment
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Controller
                name="departmentId"
                control={control}
                render={({ field }) => (
                  <BaseInput
                    as="select"
                    label="Department"
                    name="departmentId"
                    value={field.value}
                    onChange={handleDepartmentChange}
                    placeholder={departmentsLoading ? "Loading..." : "Select department"}
                    leftIcon={<Building2 size={16} />}
                    options={(departments ?? []).map((d) => ({ value: d.id, label: d.name }))}
                    error={departmentsError ? "Unable to load departments." : ""}
                    disabled={busy || departmentsLoading || departmentsError}
                  />
                )}
              />
              <Controller
                name="unitId"
                control={control}
                render={({ field }) => (
                  <BaseInput
                    as="select"
                    label="Unit"
                    name="unitId"
                    value={field.value}
                    onChange={handleUnitChange}
                    placeholder={!departmentId ? "Select department first" : unitsLoading ? "Loading..." : "No unit"}
                    leftIcon={<Users2 size={16} />}
                    options={(units ?? []).map((u) => ({ value: u.id, label: u.name }))}
                    disabled={busy || !departmentId || unitsLoading}
                  />
                )}
              />
              <Controller
                name="positionId"
                control={control}
                render={({ field }) => (
                  <BaseInput
                    as="select"
                    label="Position"
                    name="positionId"
                    value={field.value}
                    onChange={(_, value) => field.onChange(value)}
                    placeholder={!unitId ? "Select unit first" : positionsLoading ? "Loading..." : "No position"}
                    leftIcon={<IdCard size={16} />}
                    options={(positions ?? []).map((p) => ({ value: p.id, label: p.title }))}
                    disabled={busy || !unitId || positionsLoading}
                  />
                )}
              />
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Unit and Position can be left unset; Department must be an existing department once assigned.
            </p>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default EditUserModal;
