import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import {
  User,
  AtSign,
  Phone,
  Image,
  Loader2,
  Save,
  RotateCcw,
  Building2,
  Boxes,
  IdCard,
  ShieldCheck,
  Clock,
} from "lucide-react";
import PageHeader from "../components/shared/PageHeader";
import BaseInput from "../components/shared/BaseInput";
import useAuthStore from "../store/authStore";
import { useUpdateOwnProfile } from "../hooks/useUpdateOwnProfile";
import { getInitials, formatDateTime } from "../utils/formatters";
import { getDashboardHomePath } from "../utils/dashboardHome";

// Mirrors server/services/phone.service.js's normalizePhoneNumber acceptance
// rules -- 0/255/+255 prefix followed by a 9-digit 6xx/7xx subscriber number.
const TZ_PHONE_REGEX = /^(\+255|255|0)[67]\d{8}$/;

// Mirrors server/validators/userProfile.validation.js's
// updateOwnProfileValidationRules field-for-field -- this is the ENTIRE
// self-service surface. username, employeeNumber, nationalId, roles,
// department, unit, position, password, and status are never part of this
// form; those all go through admin-only or dedicated flows.
const profileSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, "First name cannot be empty")
    .max(100, "First name must be at most 100 characters"),
  middleName: z.string().trim().max(100, "Middle name must be at most 100 characters").optional().or(z.literal("")),
  lastName: z
    .string()
    .trim()
    .min(1, "Last name cannot be empty")
    .max(100, "Last name must be at most 100 characters"),
  email: z.string().trim().min(1, "Email cannot be empty").email("Enter a valid email address"),
  phoneNumber: z
    .string()
    .trim()
    .min(1, "Phone number cannot be empty")
    .regex(TZ_PHONE_REGEX, "Enter a valid Tanzanian phone number (e.g. 0712345678)"),
  profileImage: z.string().trim().max(1000, "URL is too long").optional().or(z.literal("")),
});

const STATUS_DISPLAY = {
  ACTIVE: { label: "Active", dotClass: "bg-green-500", textClass: "text-green-700" },
  LOCKED: { label: "Locked", dotClass: "bg-red-500", textClass: "text-red-700" },
  PENDING_ACTIVATION: { label: "Pending", dotClass: "bg-blue-400", textClass: "text-blue-700" },
  SUSPENDED: { label: "Suspended", dotClass: "bg-amber-500", textClass: "text-amber-700" },
  DISABLED: { label: "Disabled", dotClass: "bg-gray-400", textClass: "text-gray-600" },
  ARCHIVED: { label: "Archived", dotClass: "bg-gray-400", textClass: "text-gray-600" },
};

const Profile = () => {
  const user = useAuthStore((state) => state.user);
  const { mutate: submitUpdate, isPending } = useUpdateOwnProfile();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName ?? "",
      middleName: user?.middleName ?? "",
      lastName: user?.lastName ?? "",
      email: user?.email ?? "",
      phoneNumber: user?.phoneNumber ?? "",
      profileImage: user?.profileImage ?? "",
    },
  });

  const onSubmit = (formData) => {
    submitUpdate(
      {
        ...formData,
        middleName: formData.middleName || undefined,
        profileImage: formData.profileImage || undefined,
      },
      {
        onSuccess: (updatedUser) => {
          toast.success("Profile updated successfully.");
          reset({
            firstName: updatedUser.firstName ?? "",
            middleName: updatedUser.middleName ?? "",
            lastName: updatedUser.lastName ?? "",
            email: updatedUser.email ?? "",
            phoneNumber: updatedUser.phoneNumber ?? "",
            profileImage: updatedUser.profileImage ?? "",
          });
        },
        onError: (error) => {
          const message = error?.response?.data?.message || "Unable to update your profile. Please try again.";
          toast.error(message);
        },
      },
    );
  };

  const busy = isSubmitting || isPending;
  const statusDisplay = STATUS_DISPLAY[user?.status] || { label: user?.status, dotClass: "bg-gray-400", textClass: "text-gray-600" };

  return (
    <div className="p-2 xl:p-4">
      <PageHeader
        title="My Profile"
        description="View your account details and update your personal information."
        breadcrumbs={[{ label: "Dashboard", to: getDashboardHomePath(user) }, { label: "My Profile" }]}
      />

      <div className="max-w-3xl space-y-6">
        {/* Read-only account overview -- everything here is admin-managed. */}
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-goldAccent text-lg font-bold text-primaryBlueDark">
              {getInitials(user?.fullName || user?.username) || <User size={22} />}
            </span>
            <div className="min-w-0">
              <p className="text-lg font-bold text-gray-900 truncate">{user?.fullName || user?.username}</p>
              <p className="text-sm text-gray-500 truncate">@{user?.username}</p>
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                {user?.roles?.map((role) => (
                  <span
                    key={role.id}
                    className="inline-flex items-center rounded-full bg-primaryBlueLight px-2 py-0.5 text-[11px] font-semibold text-primaryBlue"
                  >
                    {role.name}
                  </span>
                ))}
                <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${statusDisplay.textClass}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${statusDisplay.dotClass}`} />
                  {statusDisplay.label}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-5 border-t border-gray-100">
            <div className="flex items-start gap-2.5">
              <Building2 size={16} className="mt-0.5 shrink-0 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">Department</p>
                <p className="text-sm text-gray-700">{user?.department?.name || "—"}</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Boxes size={16} className="mt-0.5 shrink-0 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">Unit</p>
                <p className="text-sm text-gray-700">{user?.unit?.name || "—"}</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <IdCard size={16} className="mt-0.5 shrink-0 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">Position</p>
                <p className="text-sm text-gray-700">{user?.position?.title || "—"}</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <ShieldCheck size={16} className="mt-0.5 shrink-0 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">Employee Number</p>
                <p className="text-sm text-gray-700">{user?.employeeNumber || "—"}</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Clock size={16} className="mt-0.5 shrink-0 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">Last Login</p>
                <p className="text-sm text-gray-700">{formatDateTime(user?.lastLoginAt)}</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Clock size={16} className="mt-0.5 shrink-0 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">Member Since</p>
                <p className="text-sm text-gray-700">{formatDateTime(user?.createdAt)}</p>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-5 pt-4 border-t border-gray-100">
            Department, unit, position, employee number, and role assignments are managed by an administrator
            -- contact yours to request a change.
          </p>
        </div>

        {/* Editable personal information -- the self-service surface. */}
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-100 p-5 sm:p-6">
            <h2 className="font-bold text-gray-900">Personal Information</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Update your own name and contact details. For anything else, an administrator can help.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="p-5 sm:p-6 space-y-4">
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
                    leftIcon={<User size={16} />}
                    error={errors.lastName?.message}
                    disabled={busy}
                  />
                )}
              />
            </div>

            <Controller
              name="middleName"
              control={control}
              render={({ field }) => (
                <BaseInput
                  label="Middle Name"
                  name="middleName"
                  value={field.value}
                  onChange={(_, value) => field.onChange(value)}
                  placeholder="Optional"
                  leftIcon={<User size={16} />}
                  error={errors.middleName?.message}
                  disabled={busy}
                />
              )}
            />

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
                    autoComplete="email"
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
            </div>

            <Controller
              name="profileImage"
              control={control}
              render={({ field }) => (
                <BaseInput
                  label="Profile Image URL"
                  name="profileImage"
                  value={field.value}
                  onChange={(_, value) => field.onChange(value)}
                  placeholder="https://..."
                  leftIcon={<Image size={16} />}
                  error={errors.profileImage?.message}
                  helperText={errors.profileImage ? undefined : "A link to an image hosted elsewhere -- leave blank to use your initials."}
                  disabled={busy}
                />
              )}
            />

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() =>
                  reset({
                    firstName: user?.firstName ?? "",
                    middleName: user?.middleName ?? "",
                    lastName: user?.lastName ?? "",
                    email: user?.email ?? "",
                    phoneNumber: user?.phoneNumber ?? "",
                    profileImage: user?.profileImage ?? "",
                  })
                }
                disabled={busy || !isDirty}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RotateCcw size={15} />
                Discard Changes
              </button>
              <button
                type="submit"
                disabled={busy || !isDirty}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primaryBlue px-5 py-2.5 text-sm font-semibold text-white hover:bg-primaryBlueDark transition-colors disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
