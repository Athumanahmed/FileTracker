import { History } from "lucide-react";
import EmptyState from "../../shared/EmptyState";
import { formatDateTime } from "../../../utils/formatters";
import { useFileTimeline } from "../../../hooks/useFileTimeline";

const FileTimelineTab = ({ fileId }) => {
  const { data, isLoading, isError, refetch } = useFileTimeline(fileId, { sortOrder: "asc" });
  const events = data?.data ?? [];

  if (isLoading) {
    return (
      <div className="space-y-5 animate-pulse">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="h-8 w-8 shrink-0 rounded-full bg-gray-100" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 w-1/2 rounded bg-gray-100" />
              <div className="h-3 w-1/3 rounded bg-gray-100" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center">
        <p className="text-sm text-red-600">Unable to load the timeline.</p>
        <button type="button" onClick={() => refetch()} className="mt-1.5 text-sm font-semibold text-red-700 hover:underline">
          Try again
        </button>
      </div>
    );
  }

  if (!events.length) {
    return <EmptyState title="No timeline events yet" message="Activity on this file will appear here as it happens." icon={History} />;
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <ol className="relative">
        {events.map((event, index) => (
          <li key={event.id} className="relative pl-9 pb-6 last:pb-0">
            {index !== events.length - 1 && <span className="absolute left-[13px] top-7 bottom-0 w-px bg-gray-100" />}
            <span className="absolute left-0 top-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-primaryBlueLight text-primaryBlue">
              <History size={13} />
            </span>
            <p className="text-sm font-medium text-gray-900">{event.title}</p>
            {event.description && <p className="text-sm text-gray-600 mt-0.5">{event.description}</p>}
            <p className="text-xs text-gray-400 mt-1">
              {formatDateTime(event.occurredAt)}
              {event.actor?.fullName && <> &middot; by {event.actor.fullName}</>}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
};

export default FileTimelineTab;
