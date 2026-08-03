import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Link } from "react-router-dom";
import { AlertTriangle, FileText } from "lucide-react";
import { getFileStatusMeta, getFilePriorityMeta } from "../../../utils/fileStatusMeta";

dayjs.extend(relativeTime);

const Skeleton = () => (
  <div className="space-y-4 animate-pulse">
    {[0, 1, 2, 3, 4].map((i) => (
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

/** Latest files, newest first -- purely presentational; caller supplies data via useFiles({ sortBy: "createdAt", sortOrder: "desc", limit }). */
const RecentFilesCard = ({ data, isLoading, isError, refetch }) => (
  <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm flex flex-col lg:col-span-2">
    <div className="flex items-center justify-between">
      <h2 className="font-semibold text-gray-900">Recently Registered Files</h2>
      <Link to="/registry/files" className="text-sm font-medium text-primaryBlue hover:underline">
        View all
      </Link>
    </div>

    <div className="mt-4 flex-1">
      {isLoading ? (
        <Skeleton />
      ) : isError ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <AlertTriangle className="text-amber-500" size={20} />
          <p className="text-sm text-gray-500">Unable to load recent files.</p>
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
                  <p className="text-sm font-medium text-gray-800 truncate">{file.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {file.fileNumber} &middot; {file.department?.name} &middot; {dayjs(file.createdAt).fromNow()}
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
        <p className="text-sm text-gray-400 py-6 text-center">No files registered yet.</p>
      )}
    </div>
  </div>
);

export default RecentFilesCard;
