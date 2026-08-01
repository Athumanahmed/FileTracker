import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import {
  LockKeyhole,
  X,
  Loader,
  ShieldCheck,
  Lock,
  Clock,
  FileText,
  CircleCheck,
  Circle,
} from "lucide-react";
import PasswordField from "../components/shared/PasswordField";
import { useResetPassword } from "../hooks/useResetPassword";
import {
  PASSWORD_REQUIREMENTS,
  getPasswordStrength,
} from "../utils/passwordRequirements";
import { imageAssets } from "../assets/assets";

const resetPasswordSchema = z
  .object({
    newPassword: z.string().min(1, "New password is required"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .superRefine((values, ctx) => {
    const failed = PASSWORD_REQUIREMENTS.find(
      (req) => !req.test(values.newPassword),
    );
    if (failed) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["newPassword"],
        message: failed.label,
      });
    }
    if (
      values.confirmPassword &&
      values.confirmPassword !== values.newPassword
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        message: "Passwords do not match",
      });
    }
  });

const FEATURES = [
  {
    icon: ShieldCheck,
    title: "Secure",
    description: "Enterprise-grade security to protect your data",
  },
  {
    icon: Lock,
    title: "Private",
    description: "Your information is safe and confidential",
  },
  {
    icon: Clock,
    title: "Compliant",
    description: "Meets government security standards and policies",
  },
  {
    icon: FileText,
    title: "Reliable",
    description: "Built for performance and reliability",
  },
];

const ResetPassword = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const resetToken = state?.resetToken;
  const { mutate: resetPassword, isPending } = useResetPassword();

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  const newPasswordValue = watch("newPassword");
  const strength = getPasswordStrength(newPasswordValue);

  useEffect(() => {
    if (!resetToken) {
      navigate("/forgot-password", { replace: true });
    }
  }, [resetToken, navigate]);

  if (!resetToken) return null;

  const onSubmit = ({ newPassword, confirmPassword }) => {
    resetPassword(
      { resetToken, newPassword, confirmPassword },
      {
        onSuccess: (data) => {
          toast.success(
            data.message || "Password reset successfully. Please sign in.",
          );
          navigate("/login", { replace: true });
        },
        onError: (error) => {
          const message =
            error?.response?.data?.message ||
            "Unable to reset password. Please try again.";
          toast.error(message);
        },
      },
    );
  };

  return (
    <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-2">
      <div className="hidden lg:flex relative flex-col justify-between bg-primaryBlue text-white p-12 xl:p-20 overflow-hidden">
        <div className="relative">
          <h1 className="mt-6 text-2xl leading-snug font-bold xl:text-3xl">
            Electronic File Tracking &amp; Management System
          </h1>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/80">
            A secure and efficient platform for managing, tracking, and
            collaborating on official documents across the Municipal Council.
          </p>

          <ul className="mt-8 space-y-5">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <li key={title} className="flex items-start gap-3 py-1.5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/30">
                  <Icon size={18} />
                </span>
                <div>
                  <p className="text-sm font-semibold">{title}</p>
                  <p className="mt-0.5 text-xs text-white/70">{description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="relative flex flex-col justify-center bg-white px-6 py-10 sm:px-10 sm:py-12 lg:px-16 xl:px-24 overflow-y-auto">
        <div className="flex lg:hidden items-center justify-center gap-3 mb-8">
          <img
            src={imageAssets.Coat_Of_Arms}
            alt="Municipal Council"
            className="w-11 h-11 rounded-full object-cover"
          />
          <div className="text-left">
            <p className="font-bold text-primaryBlue leading-tight">EFTMS</p>
            <p className="text-xs text-gray-500">Municipal Council</p>
          </div>
        </div>

        <div className="flex justify-center mb-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primaryBlueLight">
            <LockKeyhole className="text-primaryBlue" size={26} />
          </div>
        </div>
        <h2 className="text-center text-2xl font-bold text-gray-900">
          Reset Password
        </h2>
        <p className="mx-auto mt-1 mb-8 max-w-xs text-center text-sm text-gray-500">
          Your code has been verified. Choose a strong new password for your
          account.
        </p>

        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="mx-auto w-full max-w-sm space-y-5"
        >
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
                  <span className={`font-semibold ${strength.labelClass}`}>
                    {strength.label}
                  </span>
                </div>
                <div className="mt-1.5 flex gap-1.5">
                  {[0, 1, 2, 3].map((i) => (
                    <span
                      key={i}
                      className={`h-1.5 flex-1 rounded-full transition-colors ${
                        i < strength.bars ? strength.barClass : "bg-gray-200"
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}

            <ul className="mt-3 grid grid-cols-1 gap-x-4 gap-y-1.5 sm:grid-cols-2">
              {PASSWORD_REQUIREMENTS.map((req) => {
                const met = req.test(newPasswordValue || "");
                return (
                  <li
                    key={req.key}
                    className={`flex items-center gap-1.5 text-xs ${met ? "text-green-600" : "text-gray-500"}`}
                  >
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

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={() => navigate("/login")}
              disabled={isPending}
              className="flex flex-1 items-center justify-center gap-1.5 rounded border border-gray-300 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <X size={16} />
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex flex-1 items-center justify-center gap-1.5 rounded bg-primaryBlue py-3 text-sm font-semibold text-white hover:bg-primaryBlueDark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? (
                <Loader size={16} className="animate-spin" />
              ) : (
                <LockKeyhole size={16} />
              )}
              Reset Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
