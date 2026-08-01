import { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Loader,
  MessageSquareText,
  ShieldCheck,
  FolderOpen,
  Users,
  BarChart3,
} from "lucide-react";
import OtpInput from "../components/shared/OtpInput";
import { useVerifyResetOtp } from "../hooks/useVerifyResetOtp";
import { useResendResetOtp } from "../hooks/useResendResetOtp";
import { imageAssets } from "../assets/assets";

const RESEND_COOLDOWN_SECONDS = 60;

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

const maskPhone = (phone = "") => {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return phone;
  return `${"•".repeat(Math.max(digits.length - 4, 0))}${digits.slice(-4)}`;
};

const VerifyOtp = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const phoneNumber = state?.phoneNumber;

  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [inputKey, setInputKey] = useState(0);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);

  const { mutate: verifyOtp, isPending: isVerifying } = useVerifyResetOtp();
  const { mutate: resendOtp, isPending: isResending } = useResendResetOtp();

  useEffect(() => {
    if (!phoneNumber) {
      navigate("/forgot-password", { replace: true });
    }
  }, [phoneNumber, navigate]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  if (!phoneNumber) return null;

  const resetOtpBoxes = () => {
    setOtp("");
    setInputKey((prev) => prev + 1);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setOtpError("Enter the 6-digit code");
      return;
    }
    setOtpError("");

    verifyOtp(
      { phoneNumber, otp },
      {
        onSuccess: (data) => {
          toast.success("Code verified.");
          navigate("/reset-password", {
            state: { resetToken: data.data.resetToken },
          });
        },
        onError: (error) => {
          const message =
            error?.response?.data?.message ||
            "Invalid or expired OTP. Please try again.";
          toast.error(message);
          resetOtpBoxes();
        },
      },
    );
  };

  const handleResend = () => {
    resendOtp(
      { phoneNumber },
      {
        onSuccess: (data) => {
          toast.success(data.message || "A new code has been sent.");
          setCooldown(RESEND_COOLDOWN_SECONDS);
          resetOtpBoxes();
        },
        onError: (error) => {
          const message =
            error?.response?.data?.message ||
            "Unable to resend code. Please try again.";
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
              <MessageSquareText className="text-primaryBlue" size={26} />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-center text-gray-900">
            Enter Verification Code
          </h2>
          <p className="text-sm text-gray-500 text-center mt-1 mb-8">
            We sent a 6-digit code via SMS to{" "}
            <span className="font-semibold text-gray-700">
              {maskPhone(phoneNumber)}
            </span>
          </p>

          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            <OtpInput
              key={inputKey}
              length={6}
              value={otp}
              onChange={(value) => {
                setOtp(value);
                if (otpError) setOtpError("");
              }}
              error={otpError}
              disabled={isVerifying}
            />

            <button
              type="submit"
              disabled={isVerifying}
              className="w-full flex items-center justify-center gap-2 bg-primaryBlue hover:bg-primaryBlueDark text-white font-semibold text-sm rounded-xl py-3 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isVerifying && <Loader size={18} className="animate-spin" />}
              Verify Code
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            Didn&apos;t receive the code?{" "}
            {cooldown > 0 ? (
              <span className="text-gray-400">Resend in {cooldown}s</span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={isResending}
                className="font-semibold text-primaryBlue hover:underline disabled:opacity-60"
              >
                {isResending ? "Sending..." : "Resend Code"}
              </button>
            )}
          </div>

          <Link
            to="/forgot-password"
            className="mt-8 flex items-center justify-center gap-1.5 text-sm font-medium text-gray-500 hover:text-primaryBlue"
          >
            <ArrowLeft size={15} />
            Change phone number
          </Link>
        </div>
      </div>
    </div>
  );
};

export default VerifyOtp;
