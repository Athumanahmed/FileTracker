import { useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import {
  User,
  AtSign,
  Phone,
  IdCard,
  Building2,
  Loader2,
  Send,
  ShieldCheck,
  RotateCcw,
} from "lucide-react";
import BaseInput from "../shared/BaseInput";
import UserCreatedSuccessModal from "./UserCreatedSuccessModal";
import { useDepartments } from "../../hooks/useDepartments";
import { useCreateUser } from "../../hooks/useCreateUser";
import { createHod } from "../../utils/apiServices";

// Mirrors server/services/phone.service.js's normalizePhoneNumber acceptance
// rules -- 0/255/+255 prefix followed by a 9-digit 6xx/7xx subscriber number.
const TZ_PHONE_REGEX = /^(\+255|255|0)[67]\d{8}$/;

// Mirrors server/validators/user.validation.js's createHodValidationRules
// (baseUserFieldsRules + requireDepartmentId, the rules POST
// /api/v1/users/hods actually runs) field-for-field, so nothing that
// passes here gets rejected server-side.
const createHodSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, "First name is required")
    .max(100, "First name must be at most 100 characters"),
  lastName: z
    .string()
    .trim()
    .min(1, "Last name is required")
    .max(100, "Last name must be at most 100 characters"),
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(100, "Username must be at most 100 characters"),
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email address"),
  phoneNumber: z
    .string()
    .trim()
    .min(1, "Phone number is required")
    .regex(TZ_PHONE_REGEX, "Enter a valid Tanzanian phone number (e.g. 0712345678)"),
  departmentId: z
    .string()
    .trim()
    .min(1, "Select which department this Head of Department will lead"),
});

const defaultValues = {
  firstName: "",
  lastName: "",
  username: "",
  email: "",
  phoneNumber: "",
  departmentId: "",
};

/**
 * HOD is SYSTEM_ADMIN-created but department-scoped -- unlike Director,
 * this form must say which department the new HOD will lead (mandatory
 * input; see server/validators/user.validation.js's requireDepartmentId).
 * Unit is intentionally not asked here -- HOD leads a whole department,
 * not one specific unit within it.
 */
const CreateHoD = () => {
  const navigate = useNavigate();
  const { data: departments, isLoading: departmentsLoading, isError: departmentsError } = useDepartments();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(createHodSchema),
    defaultValues,
  });

  const { mutate: submitCreateHod, isPending, data: createdResult, reset: resetMutation } =
    useCreateUser(createHod);

  const onSubmit = (formData) => {
    submitCreateHod(formData, {
      onError: (error) => {
        const message =
          error?.response?.data?.message || "Unable to create Head of Department. Please try again.";
        toast.error(message);
      },
    });
  };

  const handleCreateAnother = () => {
    reset();
    resetMutation();
  };

  const handleDone = () => {
    resetMutation();
    navigate("/admin/users");
  };

  const busy = isSubmitting || isPending;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="flex items-start gap-3 border-b border-gray-100 p-5 sm:p-6">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primaryBlueLight text-primaryBlue">
          <Building2 size={20} />
        </span>
        <div>
          <h2 className="font-bold text-gray-900">Head of Department Registration</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Provide the information needed to create this Head of Department&apos;s account.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="p-5 sm:p-6 space-y-6">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">
            Personal Information
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Controller
              name="firstName"
              control={control}
              render={({ field }) => (
                <BaseInput
                  label="First Name"
                  name="firstName"
                  required
                  value={field.value}
                  onChange={(_, value) => field.onChange(value)}
                  placeholder="e.g. Halima"
                  leftIcon={<User size={16} />}
                  error={errors.firstName?.message}
                  disabled={busy}
                />
              )}
            />
            <Controller
              name="lastName"
              control={control}
              render={({ field }) => (
                <BaseInput
                  label="Last Name"
                  name="lastName"
                  required
                  value={field.value}
                  onChange={(_, value) => field.onChange(value)}
                  placeholder="e.g. Mrisho"
                  leftIcon={<User size={16} />}
                  error={errors.lastName?.message}
                  disabled={busy}
                />
              )}
            />
          </div>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">
            Account Information
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Controller
              name="username"
              control={control}
              render={({ field }) => (
                <BaseInput
                  label="Username"
                  name="username"
                  required
                  value={field.value}
                  onChange={(_, value) => field.onChange(value)}
                  placeholder="e.g. halima.hod"
                  leftIcon={<IdCard size={16} />}
                  error={errors.username?.message}
                  autoComplete="username"
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
                  autoComplete="tel"
                  disabled={busy}
                />
              )}
            />
            <div className="sm:col-span-2">
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
                    placeholder="e.g. halima.hod@eftms.test"
                    leftIcon={<AtSign size={16} />}
                    error={errors.email?.message}
                    autoComplete="email"
                    disabled={busy}
                  />
                )}
              />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">
            Organizational Assignment
          </h3>
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
          <p className="text-xs text-gray-400 mt-1.5">
            The department this Head of Department will lead. Each department has exactly one HOD.
          </p>
        </div>

        <div className="flex items-start gap-2.5 rounded-xl bg-primaryBlueLight px-4 py-3.5">
          <ShieldCheck className="mt-0.5 shrink-0 text-primaryBlue" size={16} />
          <p className="text-xs leading-relaxed text-gray-600">
            <span className="font-semibold text-gray-800">Password: </span>
            A secure temporary password will be generated automatically and shown once, immediately after
            this account is created.
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
            Create Head of Department
          </button>
        </div>
      </form>

      {createdResult && (
        <UserCreatedSuccessModal
          user={createdResult.user}
          defaultPassword={createdResult.defaultPassword}
          onCreateAnother={handleCreateAnother}
          onDone={handleDone}
        />
      )}
    </div>
  );
};

export default CreateHoD;
