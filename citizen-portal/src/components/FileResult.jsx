import dayjs from "dayjs";
import { FileText, CheckCircle2, Clock, CircleDot, RotateCcw, Info } from "lucide-react";

const STATUS_TONE = {
  COMPLETED: "bg-green-50 text-green-700 ring-green-200",
  APPROVED: "bg-green-50 text-green-700 ring-green-200",
  ARCHIVED: "bg-green-50 text-green-700 ring-green-200",
  REJECTED: "bg-red-50 text-red-700 ring-red-200",
  CLOSED: "bg-gray-100 text-gray-700 ring-gray-200",
  ON_HOLD: "bg-amber-50 text-amber-700 ring-amber-200",
};

const fmt = (value) => (value ? dayjs(value).format("D MMM YYYY, HH:mm") : "—");

const InfoRow = ({ label, value }) => (
  <div className="flex items-start justify-between gap-3 border-b border-gray-50 py-2.5 last:border-0">
    <span className="text-sm text-gray-500">{label}</span>
    <span className="text-sm font-medium text-gray-900 text-right">{value || "—"}</span>
  </div>
);

const FileResult = ({ result, lang, t, onReset }) => {
  const pick = (obj) => (lang === "en" ? obj.en : obj.sw);
  const tone = STATUS_TONE[result.status.code] || "bg-primaryBlueLight text-primaryBlue ring-primaryBlue/20";

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primaryBlueLight text-primaryBlue">
            <FileText size={22} />
          </span>
          <div className="min-w-0">
            {result.citizenName && (
              <p className="text-xs font-medium text-gray-400">
                {t("greeting")}, {result.citizenName}
              </p>
            )}
            <h2 className="text-lg font-bold text-gray-900 break-words leading-snug">{result.title}</h2>
          </div>
        </div>

        <div className="mt-4">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ring-1 ${tone}`}>
            <CircleDot size={13} />
            {pick(result.status)}
          </span>
        </div>

        <div className="mt-5">
          <InfoRow label={t("field_tracking")} value={<span className="font-mono">{result.trackingNumber}</span>} />
          <InfoRow label={t("field_department")} value={result.department} />
          <InfoRow label={t("field_registered")} value={fmt(result.registeredAt)} />
          <InfoRow label={t("field_updated")} value={fmt(result.lastUpdatedAt)} />
        </div>
      </div>

      {result.milestones?.length > 0 && (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">{t("milestonesTitle")}</h3>
          <ol className="mt-4 space-y-1">
            {result.milestones.map((m, i) => {
              const last = i === result.milestones.length - 1;
              return (
                <li key={m.key} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    {last ? (
                      <Clock size={17} className="text-primaryBlue" />
                    ) : (
                      <CheckCircle2 size={17} className="text-green-500" />
                    )}
                    {!last && <span className="my-1 w-px flex-1 bg-gray-200" />}
                  </div>
                  <div className="pb-4">
                    <p className="text-sm font-medium text-gray-800">{pick(m)}</p>
                    <p className="text-xs text-gray-400">{fmt(m.occurredAt)}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      <div className="flex items-start gap-2.5 rounded-xl bg-primaryBlueLight px-4 py-3">
        <Info size={16} className="mt-0.5 shrink-0 text-primaryBlue" />
        <p className="text-xs leading-relaxed text-gray-600">{t("disclaimer")}</p>
      </div>

      <button
        type="button"
        onClick={onReset}
        className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
      >
        <RotateCcw size={15} />
        {t("trackAnother")}
      </button>
    </div>
  );
};

export default FileResult;
