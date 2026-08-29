import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Hash, Phone, Search, Loader2, AlertCircle } from "lucide-react";

const Field = ({ label, hint, error, icon: Icon, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
    <div className="relative">
      <Icon size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      <input
        {...props}
        className={`w-full rounded-xl border bg-white pl-9 pr-3 py-2.5 text-sm outline-none transition-all placeholder:text-gray-400 focus:ring-2 ${
          error
            ? "border-red-300 focus:ring-red-200 focus:border-red-400"
            : "border-gray-300 focus:ring-primaryBlue/15 focus:border-primaryBlue"
        }`}
      />
    </div>
    {error ? (
      <p className="mt-1.5 text-xs text-red-500">{error}</p>
    ) : hint ? (
      <p className="mt-1.5 text-xs text-gray-400">{hint}</p>
    ) : null}
  </div>
);

const TrackForm = ({ t, onSubmit, isSubmitting, errorText }) => {
  const schema = z.object({
    trackingNumber: z.string().trim().min(1, t("required")),
    phone: z.string().trim().min(1, t("required")),
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema), defaultValues: { trackingNumber: "", phone: "" } });

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-5"
    >
      <Controller
        name="trackingNumber"
        control={control}
        render={({ field }) => (
          <Field
            label={t("trackingNumber")}
            hint={t("trackingNumberHint")}
            error={errors.trackingNumber?.message}
            icon={Hash}
            placeholder="TMC/TRK/2026/000123"
            autoComplete="off"
            disabled={isSubmitting}
            value={field.value}
            onChange={(e) => field.onChange(e.target.value)}
          />
        )}
      />

      <Controller
        name="phone"
        control={control}
        render={({ field }) => (
          <Field
            label={t("phone")}
            hint={t("phoneHint")}
            error={errors.phone?.message}
            icon={Phone}
            type="tel"
            inputMode="tel"
            placeholder="0768 000 000"
            autoComplete="tel"
            disabled={isSubmitting}
            value={field.value}
            onChange={(e) => field.onChange(e.target.value)}
          />
        )}
      />

      {errorText && (
        <div className="flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{errorText}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primaryBlue px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-primaryBlueDark disabled:opacity-60"
      >
        {isSubmitting ? <Loader2 size={17} className="animate-spin" /> : <Search size={16} />}
        {isSubmitting ? t("submitting") : t("submit")}
      </button>
    </form>
  );
};

export default TrackForm;
