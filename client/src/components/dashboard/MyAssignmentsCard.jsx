import { Link } from "react-router-dom";
import { AlertTriangle, FileText, UserCheck } from "lucide-react";
import { getFileStatusMeta, getFilePriorityMeta } from "../../utils/fileStatusMeta";

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
 * Files currently assigned to the viewer -- purely presentational; caller
 * supplies data via useFiles({ assignedToId: user.id, ... }). Shared by
 * every workflow-assignee role's own dashboard (Officer, Director, ...)
 * rather than duplicated per role -- only `basePath` (e.g. "/officer",
 * "/director") varies.
 */
const MyAssignmentsCard = ({ basePath, data, isLoading, isError, refetch }) => (
  <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm flex flex-col lg:col-span-2">
    <div className="flex items-center justify-between">
      <h2 className="font-semibold text-gray-900">My Assignments</h2>
      <Link to={`${basePath}/workflow`} className="text-sm font-medium text-primaryBlue hover:underline">
        View all
      </Link>
    </div>

    <div className="mt-4 flex-1">
      {isLoading ? (
        <Skeleton />
      ) : isError ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <AlertTriangle className="text-amber-500" size={20} />
          <p className="text-sm text-gray-500">Unable to load your assignments.</p>
          <button type="button" onClick={() => refetch()} className="text-sm font-medium text-primaryBlue hover:underline">
            Retry
          </button>
        </div>
      ) : data?.length ? (
        <ul className="divide-y divide-gray-50">
          {data.map((file) => {
            const status = getFileStatusMeta(file.status);
            const priority = getFilePriorityMeta(file.priority);
            return (
              <li key={file.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primaryBlueLight text-primaryBlue">
                  <FileText size={15} />
                </span>
                <div className="min-w-0 flex-1">
                  <Link to={`${basePath}/files/${file.id}`} state={{ initialTab: "workflow" }} className="text-sm font-medium text-gray-800 truncate hover:text-primaryBlue">
                    {file.title}
                  </Link>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {file.fileNumber} &middot; {file.department?.name}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${status.badgeClass}`}>
                    {status.label}
                  </span>
                  {file.priority !== "NORMAL" && (
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${priority.badgeClass}`}>
                      {priority.label}
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-gray-400">
            <UserCheck size={20} />
          </span>
          <p className="text-sm text-gray-400">No files assigned to you right now.</p>
        </div>
      )}
    </div>
  </div>
);

export default MyAssignmentsCard;
