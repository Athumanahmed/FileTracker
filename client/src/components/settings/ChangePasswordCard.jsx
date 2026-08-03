import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { KeyRound, Loader2, CircleCheck, Circle } from "lucide-react";
import PasswordField from "../shared/PasswordField";
import { useChangePassword } from "../../hooks/useChangePassword";
import useAuthStore from "../../store/authStore";
import { PASSWORD_REQUIREMENTS, getPasswordStrength } from "../../utils/passwordRequirements";

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(1, "New password is required"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .superRefine((values, ctx) => {
    const failed = PASSWORD_REQUIREMENTS.find((req) => !req.test(values.newPassword));
    if (failed) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["newPassword"], message: failed.label });
    }
    if (values.newPassword && values.newPassword === values.currentPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["newPassword"],
        message: "New password must be different from your current password",
      });
    }
    if (values.confirmPassword && values.confirmPassword !== values.newPassword) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["confirmPassword"], message: "Passwords do not match" });
    }
  });

/** No new tokens come back from a successful change (see useChangePassword) -- clears local auth and sends the user back through a normal login, same contract the forced first-login flow already uses. */
const ChangePasswordCard = () => {
  const navigate = useNavigate();
  const accessToken = useAuthStore((state) => state.accessToken);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const { mutate: submitChange, isPending } = useChangePassword();

  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const newPasswordValue = watch("newPassword");
  const strength = getPasswordStrength(newPasswordValue);

  const onSubmit = ({ currentPassword, newPassword, confirmPassword }) => {
    submitChange(
      { accessToken, currentPassword, newPassword, confirmPassword },
      {
        onSuccess: (data) => {
          clearAuth();
          toast.success(data.message || "Password updated successfully. Please sign in again.");
          navigate("/login", { replace: true });
        },
        onError: (error) => {
          toast.error(error?.response?.data?.message || "Unable to update password. Please try again.");
        },
      },
    );
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="flex items-start gap-3 border-b border-gray-100 p-5 sm:p-6">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primaryBlueLight text-primaryBlue">
          <KeyRound size={20} />
        </span>
        <div>
          <h2 className="font-bold text-gray-900">Change Password</h2>
          <p className="text-sm text-gray-500 mt-0.5">Choose a strong password you don't use anywhere else.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="p-5 sm:p-6 space-y-4">
        <PasswordField
          name="currentPassword"
          label="Current Password"
          control={control}
          error={errors.currentPassword?.message}
          placeholder="Enter your current password"
          disabled={isPending}
          autoComplete="current-password"
        />

        <div>
          <PasswordField
            name="newPassword"
            label="New Password"
            control={control}
            error={errors.newPassword?.message}
            placeholder="Enter your new password"
            disabled={isPending}
          />

          {newPasswordValue && (
            <div className="mt-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Password strength:</span>
                <span className={`font-semibold ${strength.labelClass}`}>{strength.label}</span>
              </div>
              <div className="mt-1.5 flex gap-1.5">
                {[0, 1, 2, 3].map((i) => (
                  <span key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i < strength.bars ? strength.barClass : "bg-gray-200"}`} />
                ))}
              </div>
            </div>
          )}

          <ul className="mt-3 grid grid-cols-1 gap-x-4 gap-y-1.5 sm:grid-cols-2">
            {PASSWORD_REQUIREMENTS.map((req) => {
              const met = req.test(newPasswordValue || "");
              return (
                <li key={req.key} className={`flex items-center gap-1.5 text-xs ${met ? "text-green-600" : "text-gray-500"}`}>
                  {met ? <CircleCheck size={14} /> : <Circle size={14} />}
                  {req.label}
                </li>
              );
            })}
          </ul>
        </div>

        <PasswordField
          name="confirmPassword"
          label="Confirm New Password"
          control={control}
          error={errors.confirmPassword?.message}
          placeholder="Confirm your new password"
          disabled={isPending}
        />

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={() => reset()}
            disabled={isPending}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
          >
            Clear
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primaryBlue px-5 py-2.5 text-sm font-semibold text-white hover:bg-primaryBlueDark transition-colors disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
            Update Password
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChangePasswordCard;
