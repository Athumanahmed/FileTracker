import { Link } from "react-router-dom";
import { ArrowUp, Minus } from "lucide-react";

const ICON_TONES = {
  blue: "bg-blue-50 text-blue-600",
  green: "bg-green-50 text-green-600",
  amber: "bg-amber-50 text-amber-600",
  purple: "bg-purple-50 text-purple-600",
  teal: "bg-teal-50 text-teal-600",
  red: "bg-red-50 text-red-600",
  gray: "bg-gray-100 text-gray-600",
};

const formatValue = (value) =>
  typeof value === "number" ? value.toLocaleString() : value;

const Skeleton = () => (
  <div className="flex items-start justify-between animate-pulse">
    <div className="flex flex-col gap-2.5 w-full">
      <div className="h-3.5 w-20 rounded bg-gray-100" />
      <div className="h-6 w-14 rounded bg-gray-200" />
      <div className="h-3 w-24 rounded bg-gray-100" />
    </div>
    <div className="h-11 w-11 shrink-0 rounded-xl bg-gray-100" />
  </div>
);

/**
 * The one stats card every dashboard/list page reaches for -- single
 * source of truth for this look, so a styling change never has to be
 * repeated across pages. `change` is a week-over-week growth percent (see
 * server/services/dashboard.service.js); omit it entirely for a metric
 * with no trend to show.
 */
const StatCard = ({
  icon: Icon,
  tone = "blue",
  label,
  value,
  change, // number (%) or undefined -- growth-only, never negative (see backend)
  to,
  loading = false,
  className = "",
}) => {
  const content = loading ? (
    <Skeleton />
  ) : (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm text-gray-500 truncate">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{formatValue(value)}</p>
        {change !== undefined && change !== null && (
          <p
            className={`flex items-center gap-1 text-xs mt-2 ${change === 0 ? "text-gray-400" : "text-green-600"}`}
          >
            {change === 0 ? <Minus size={12} /> : <ArrowUp size={12} />}
            {change === 0 ? "No change" : `${change}% from last week`}
          </p>
        )}
      </div>
      {Icon && (
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${ICON_TONES[tone] || ICON_TONES.blue}`}
        >
          <Icon size={20} />
        </span>
      )}
    </div>
  );

  const wrapperClassName = `rounded-2xl border border-gray-100 bg-white p-5 shadow-sm ${
    to ? "hover:shadow-md hover:border-primaryBlue/20 transition-all" : ""
  } ${className}`;

  if (to && !loading) {
    return (
      <Link to={to} className={wrapperClassName}>
        {content}
      </Link>
    );
  }

  return <div className={wrapperClassName}>{content}</div>;
};

export default StatCard;
