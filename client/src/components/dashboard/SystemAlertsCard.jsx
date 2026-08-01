import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { AlertTriangle, UserX, Info, ChevronRight } from "lucide-react";

const TONE_STYLES = {
  red: "bg-red-50 text-red-600",
  amber: "bg-amber-50 text-amber-600",
  blue: "bg-primaryBlueLight text-primaryBlue",
};

const Skeleton = () => (
  <div className="space-y-3 animate-pulse">
    {[0, 1, 2].map((i) => (
      <div key={i} className="flex items-center gap-3 rounded-xl border border-gray-100 p-3">
        <div className="h-9 w-9 shrink-0 rounded-full bg-gray-100" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 w-2/3 rounded bg-gray-100" />
          <div className="h-3 w-1/2 rounded bg-gray-100" />
        </div>
      </div>
    ))}
  </div>
);

const AlertRow = ({ icon: Icon, tone, title, description, to, onClick }) => {
  const body = (
    <>
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${TONE_STYLES[tone]}`}>
        <Icon size={16} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-800 truncate">{title}</p>
        <p className="text-xs text-gray-500 mt-0.5 truncate">{description}</p>
      </div>
      <ChevronRight size={16} className="shrink-0 text-gray-300" />
    </>
  );

  const className =
    "flex items-center gap-3 rounded-xl border border-gray-100 p-3 hover:bg-gray-50 transition-colors text-left w-full";

  if (to) {
    return (
      <Link to={to} className={className}>
        {body}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {body}
    </button>
  );
};

/**
 * `inactiveUsersCount` is real (from GET /dashboard/admin/summary). The
 * overdue-files and backup alerts are placeholders -- there's no Files
 * module or backup-tracking table on the backend yet, so they're static
 * and just toast a "coming soon" notice instead of pretending to link
 * somewhere real.
 */
const SystemAlertsCard = ({ inactiveUsersCount, loading = false }) => {
  const alerts = [];

  if (!loading && inactiveUsersCount > 0) {
    alerts.push({
      key: "inactive-users",
      icon: UserX,
      tone: "amber",
      title: `${inactiveUsersCount} user account${inactiveUsersCount === 1 ? "" : "s"} ${inactiveUsersCount === 1 ? "is" : "are"} inactive`,
      description: "Review and take action",
      to: "/admin/users",
    });
  }

  alerts.push(
    {
      key: "overdue-files",
      icon: AlertTriangle,
      tone: "red",
      title: "8 files are overdue",
      description: "Require immediate attention",
      onClick: () => toast("File tracking is coming soon."),
    },
    {
      key: "backup",
      icon: Info,
      tone: "blue",
      title: "Database backup completed",
      description: "Backup monitoring is coming soon",
      onClick: () => toast("Backup monitoring is coming soon."),
    },
  );

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <h2 className="font-semibold text-gray-900">System Alerts</h2>
      <div className="mt-4 space-y-3">
        {loading
          ? <Skeleton />
          : alerts.map(({ key, ...alert }) => <AlertRow key={key} {...alert} />)}
      </div>
    </div>
  );
};

export default SystemAlertsCard;
