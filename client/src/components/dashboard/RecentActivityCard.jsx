import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { AlertTriangle } from "lucide-react";
import { getAuditLogIcon } from "../../utils/auditLogIcons";

dayjs.extend(relativeTime);

const Skeleton = () => (
  <div className="space-y-4 animate-pulse">
    {[0, 1, 2].map((i) => (
      <div key={i} className="flex items-start gap-3">
        <div className="h-9 w-9 shrink-0 rounded-full bg-gray-100" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 w-3/4 rounded bg-gray-100" />
          <div className="h-3 w-1/3 rounded bg-gray-100" />
        </div>
      </div>
    ))}
  </div>
);

/**
 * Purely presentational -- the data-fetching hook (useAdminRecentActivity
 * for the System Admin dashboard, useScopedRecentActivity for HOD/
 * Supervisor's) is chosen by the caller and passed in, so this one card
 * serves every dashboard rather than being duplicated per role.
 */
const RecentActivityCard = ({ title = "Recent Activities", data, isLoading, isError, refetch, viewAllTo }) => {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm flex flex-col">
      <h2 className="font-semibold text-gray-900">{title}</h2>

      <div className="mt-4 flex-1">
        {isLoading ? (
          <Skeleton />
        ) : isError ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <AlertTriangle className="text-amber-500" size={20} />
            <p className="text-sm text-gray-500">Unable to load recent activity.</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="text-sm font-medium text-primaryBlue hover:underline"
            >
              Retry
            </button>
          </div>
        ) : data?.length ? (
          <ul className="space-y-4">
            {data.map((log) => {
              const Icon = getAuditLogIcon(log);
              return (
                <li key={log.id} className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primaryBlueLight text-primaryBlue">
                    <Icon size={15} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-800 leading-snug">{log.description}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {dayjs(log.createdAt).fromNow()} &middot; by {log.performedBy}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-gray-400 py-6 text-center">No recent activity yet.</p>
        )}
      </div>

      {viewAllTo ? (
        <Link
          to={viewAllTo}
          className="mt-2 flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          View All Activities
        </Link>
      ) : (
        <button
          type="button"
          onClick={() => toast("The full activity log is coming soon.")}
          className="mt-2 flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          View All Activities
        </button>
      )}
    </div>
  );
};

export default RecentActivityCard;
