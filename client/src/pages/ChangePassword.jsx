import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import {
  LockKeyhole,
  Eye,
  EyeOff,
  X,
  Loader,
  ShieldCheck,
  Lock,
  Clock,
  FileText,
  CircleCheck,
  Circle,
} from "lucide-react";
import BaseInput from "../components/shared/BaseInput";
import { useForceChangePassword } from "../hooks/useForceChangePassword";
import useAuthStore from "../store/authStore";
import { imageAssets } from "../assets/assets";

const PASSWORD_REQUIREMENTS = [
  {
    key: "length",
    label: "At least 8 characters long",
    test: (v) => v.length >= 8,
  },
  {
    key: "uppercase",
    label: "At least one uppercase letter",
    test: (v) => /[A-Z]/.test(v),
  },
  {
    key: "lowercase",
    label: "At least one lowercase letter",
    test: (v) => /[a-z]/.test(v),
  },
  { key: "number", label: "At least one number", test: (v) => /[0-9]/.test(v) },
  {
    key: "special",
    label: "At least one special character",
    test: (v) => /[^A-Za-z0-9]/.test(v),
  },
];

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
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
    if (values.newPassword && values.newPassword === values.currentPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["newPassword"],
        message: "New password must be different from your current password",
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

const getStrength = (password) => {
  if (!password) return null;
  const metCount = PASSWORD_REQUIREMENTS.filter((req) =>
    req.test(password),
  ).length;

  if (metCount <= 2)
    return {
      label: "Weak",
      labelClass: "text-red-500",
      barClass: "bg-red-500",
      bars: 1,
    };
  if (metCount === 3)
    return {
      label: "Fair",
      labelClass: "text-orange-500",
      barClass: "bg-orange-500",
      bars: 2,
    };
  if (metCount === 4)
    return {
      label: "Good",
      labelClass: "text-yellow-600",
      barClass: "bg-yellow-500",
      bars: 3,
    };
  return {
    label: "Strong",
    labelClass: "text-green-600",
    barClass: "bg-green-500",
    bars: 4,
  };
};

const PasswordField = ({
  name,
  label,
  control,
  error,
  placeholder,
  disabled,
}) => {
  const [visible, setVisible] = useState(false);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <BaseInput
          label={label}
          name={name}
          type={visible ? "text" : "password"}
          value={field.value}
          onChange={(_, value) => field.onChange(value)}
          placeholder={placeholder}
          leftIcon={<Lock size={16} />}
          rightIcon={visible ? <EyeOff size={16} /> : <Eye size={16} />}
          onRightIconClick={() => setVisible((prev) => !prev)}
          error={error}
          autoComplete={
            name === "currentPassword" ? "current-password" : "new-password"
          }
          disabled={disabled}
        />
      )}
    />
  );
};

const ChangePassword = () => {
  const navigate = useNavigate();
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const loadingUser = useAuthStore((state) => state.loadingUser);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const logout = useAuthStore((state) => state.logout);
  const { mutate: changePassword, isPending } = useForceChangePassword();

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const newPasswordValue = watch("newPassword");
  const strength = getStrength(newPasswordValue);

  useEffect(() => {
    if (!loadingUser && !accessToken) {
      navigate("/login", { replace: true });
    }
  }, [loadingUser, accessToken, navigate]);

  const onSubmit = ({ currentPassword, newPassword, confirmPassword }) => {
    changePassword(
      { accessToken, currentPassword, newPassword, confirmPassword },
      {
        onSuccess: (data) => {
          clearAuth();
          toast.success(data.message || "Password updated successfully.");
          navigate("/login", { replace: true });
        },
        onError: (error) => {
          const message =
            error?.response?.data?.message ||
            "Unable to update password. Please try again.";
          toast.error(message);
        },
      },
    );
  };

  const handleCancel = async () => {
    await logout();
    navigate("/login", { replace: true });
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
          Change Password
        </h2>
        <p className="mx-auto mt-1 mb-8 max-w-xs text-center text-sm text-gray-500">
          For your security, please choose a strong new password that you
          don&apos;t use elsewhere.
        </p>

        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="mx-auto w-full max-w-sm space-y-5 "
        >
          <PasswordField
            name="currentPassword"
            label="Current Password"
            control={control}
            error={errors.currentPassword?.message}
            placeholder="Enter your current password"
            disabled={isPending}
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
              onClick={handleCancel}
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
              Update Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;
