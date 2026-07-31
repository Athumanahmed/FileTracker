import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import {
  Lock,
  User,
  Eye,
  EyeOff,
  LogIn,
  Loader,
  ShieldCheck,
  FolderOpen,
  Users,
  BarChart3,
} from "lucide-react";
import BaseInput from "../components/shared/BaseInput";
import { useLogin } from "../hooks/useLogin";
import useAuthStore from "../store/authStore";
import { imageAssets } from "../assets/assets";

const loginSchema = z.object({
  username: z.string().trim().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
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

const Login = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const fetchUserProfile = useAuthStore((state) => state.fetchUserProfile);
  const { mutate: login, isPending } = useLogin();
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "", rememberMe: false },
  });

  const onSubmit = ({ username, password }) => {
    login(
      { username, password },
      {
        onSuccess: async ({ data }) => {
          setAuth({ accessToken: data.accessToken, user: data.user });

          if (data.user.mustChangePassword) {
            toast("You must set a new password before continuing.");
            navigate("/change-password");
            return;
          }

          toast.success(`Welcome back, ${data.user.username}!`);
          navigate("/");
          await fetchUserProfile();
        },
        onError: (error) => {
          const message =
            error?.response?.data?.message ||
            "Unable to sign in. Please try again.";
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

        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-primaryBlueLight flex items-center justify-center">
            <Lock className="text-primaryBlue" size={26} />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-center text-gray-900">
          Welcome Back
        </h2>
        <p className="text-sm text-gray-500 text-center mt-1 mb-8">
          Sign in to your account to continue
        </p>

        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="space-y-5 w-full max-w-sm mx-auto"
        >
          <Controller
            name="username"
            control={control}
            render={({ field }) => (
              <BaseInput
                label="Username"
                name="username"
                value={field.value}
                onChange={(_, value) => field.onChange(value)}
                placeholder="Enter your username"
                leftIcon={<User size={16} />}
                error={errors.username?.message}
                autoComplete="username"
                disabled={isPending}
              />
            )}
          />

          <div>
            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <BaseInput
                  label="Password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={field.value}
                  onChange={(_, value) => field.onChange(value)}
                  placeholder="Enter your password"
                  leftIcon={<Lock size={16} />}
                  rightIcon={
                    showPassword ? <EyeOff size={16} /> : <Eye size={16} />
                  }
                  onRightIconClick={() => setShowPassword((prev) => !prev)}
                  error={errors.password?.message}
                  autoComplete="current-password"
                  disabled={isPending}
                />
              )}
            />
            <div className="flex justify-end mt-1.5">
              <Link
                to="/forgot-password"
                className="text-xs font-medium text-primaryBlue hover:underline"
              >
                Forgot Password?
              </Link>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-600 select-none">
            <input
              type="checkbox"
              {...register("rememberMe")}
              disabled={isPending}
              className="w-4 h-4 rounded border-gray-300 text-primaryBlue focus:ring-primaryBlue/30"
            />
            Remember me
          </label>

          <button
            type="submit"
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2 bg-primaryBlue hover:bg-primaryBlueDark text-white font-semibold text-sm rounded py-3 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isPending ? (
              <Loader size={18} className="animate-spin" />
            ) : (
              <LogIn size={18} />
            )}
            Sign In
          </button>
        </form>

        <div className="flex items-center gap-3 w-full max-w-sm mx-auto  my-6">
          <span className="h-px flex-1 bg-gray-200" />
          <span className="text-xs text-gray-400">OR</span>
          <span className="h-px flex-1 bg-gray-200" />
        </div>

        <button
          type="button"
          onClick={() => toast("Single Sign-On is not available yet.")}
          className="w-full max-w-sm mx-auto  flex items-center justify-center gap-2 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium text-sm rounded py-3"
        >
          <ShieldCheck size={18} />
          Single Sign-On (SSO)
        </button>
      </div>
    </div>
  );
};

export default Login;
