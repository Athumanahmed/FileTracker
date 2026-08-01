import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import {
  Phone,
  Mail,
  Loader,
  ArrowLeft,
  ShieldCheck,
  FolderOpen,
  Users,
  BarChart3,
  KeyRound,
} from "lucide-react";
import BaseInput from "../components/shared/BaseInput";
import { useForgotPassword } from "../hooks/useForgotPassword";
import { imageAssets } from "../assets/assets";

const TZ_PHONE_REGEX = /^(\+255|255|0)[67]\d{8}$/;

const forgotPasswordSchema = z.object({
  phoneNumber: z
    .string()
    .trim()
    .min(1, "Phone number is required")
    .regex(
      TZ_PHONE_REGEX,
      "Enter a valid Tanzanian phone number (e.g. 0712345678)",
    ),
});

const FEATURES = [
  {
    icon: ShieldCheck,
    title: "Secure",
    description: "Enterprise-grade security for your sensitive documents",
  },
  {
    icon: FolderOpen,
    title: "Track",
    description: "Real-time tracking of files and documents",
  },
  {
    icon: Users,
    title: "Collaborate",
    description: "Work together seamlessly across departments",
  },
  {
    icon: BarChart3,
    title: "Report",
    description: "Powerful reporting and analytics dashboard",
  },
];

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("phone");
  const { mutate: requestReset, isPending } = useForgotPassword();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { phoneNumber: "" },
  });

  const onSubmit = ({ phoneNumber }) => {
    requestReset(
      { phoneNumber },
      {
        onSuccess: (data) => {
          toast.success(
            data.message ||
              "If the phone number is registered, an OTP has been sent.",
          );
          navigate("/verify-otp", { state: { phoneNumber } });
        },
        onError: (error) => {
          const message =
            error?.response?.data?.message ||
            "Unable to send OTP. Please try again.";
          toast.error(message);
        },
      },
    );
  };

  return (
    <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-2">
      <div className="hidden lg:flex relative flex-col justify-between bg-primaryBlue text-white p-12 xl:p-20 overflow-hidden min-h-screen">
        <div className="relative">
          <h1 className="mt-6 text-2xl xl:text-3xl font-bold leading-snug">
            Electronic File Tracking &amp; Management System
          </h1>
          <p className="mt-4 text-sm text-white/80 leading-relaxed max-w-sm">
            A secure and efficient platform for managing, tracking, and
            collaborating on official documents across the Municipal Council.
          </p>

          <ul className="mt-8 space-y-5">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <li key={title} className="flex items-start gap-3 py-1.5">
                <span className="shrink-0 w-10 h-10 rounded-full border border-white/30 flex items-center justify-center">
                  <Icon size={18} />
                </span>
                <div>
                  <p className="font-semibold text-sm">{title}</p>
                  <p className="text-xs text-white/70 mt-0.5">{description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex flex-col justify-center bg-white px-6 py-10 sm:px-10 sm:py-12 lg:px-16 xl:px-24 min-h-screen">
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

        <div className="w-full max-w-sm mx-auto">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-primaryBlueLight flex items-center justify-center">
              <KeyRound className="text-primaryBlue" size={26} />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-center text-gray-900">
            Forgot Password?
          </h2>
          <p className="text-sm text-gray-500 text-center mt-1 mb-8">
            Choose how you&apos;d like to receive your verification code
          </p>

          {/* TAB SWITCHER */}
          <div className="grid grid-cols-2 gap-1.5 rounded-lg bg-gray-100 p-1.5 mb-6">
            <button
              type="button"
              onClick={() => setActiveTab("email")}
              className={`flex items-center justify-center gap-1.5 rounded py-2.5 text-sm font-medium transition-colors ${
                activeTab === "email"
                  ? "bg-white text-primaryBlue shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Mail size={15} />
              Email
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("phone")}
              className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition-colors ${
                activeTab === "phone"
                  ? "bg-white text-primaryBlue shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Phone size={15} />
              Phone
            </button>
          </div>

          {activeTab === "email" ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-5 py-8 text-center">
              <Mail className="mx-auto text-gray-400" size={24} />
              <p className="mt-3 text-sm font-medium text-gray-700">
                Email reset is coming soon
              </p>
              <p className="mt-1 text-xs text-gray-500">
                For now, please use your registered phone number to receive a
                verification code.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab("phone")}
                className="mt-4 text-sm font-semibold text-primaryBlue hover:underline"
              >
                Use phone number instead
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit(onSubmit)}
              noValidate
              className="space-y-5"
            >
              <Controller
                name="phoneNumber"
                control={control}
                render={({ field }) => (
                  <BaseInput
                    label="Phone Number"
                    name="phoneNumber"
                    value={field.value}
                    onChange={(_, value) => field.onChange(value)}
                    placeholder="e.g. 0712345678"
                    leftIcon={<Phone size={16} />}
                    error={errors.phoneNumber?.message}
                    autoComplete="tel"
                    disabled={isPending}
                  />
                )}
              />

              <button
                type="submit"
                disabled={isPending}
                className="w-full flex items-center justify-center gap-2 bg-primaryBlue hover:bg-primaryBlueDark text-white font-semibold text-sm rounded py-3 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isPending && <Loader size={18} className="animate-spin" />}
                Send Verification Code
              </button>
            </form>
          )}

          <Link
            to="/login"
            className="mt-8 flex items-center justify-center gap-1.5 text-sm font-medium text-gray-500 hover:text-primaryBlue"
          >
            <ArrowLeft size={15} />
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
