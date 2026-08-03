import { useState } from "react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { CheckCheck, Inbox } from "lucide-react";
import EmptyState from "../shared/EmptyState";
import DataPagination from "../shared/DataPagination";
import { getDashboardHomePath } from "../../utils/dashboardHome";
import { getNotificationMeta } from "../../utils/notificationMeta";
import useAuthStore from "../../store/authStore";
import { useMyNotifications } from "../../hooks/useMyNotifications";
import { useMarkNotificationRead } from "../../hooks/useMarkNotificationRead";
import { useMarkAllNotificationsRead } from "../../hooks/useMarkAllNotificationsRead";

dayjs.extend(relativeTime);

const PAGE_SIZE = 15;

const FILTERS = [
  { value: "", label: "All" },
  { value: "false", label: "Unread" },
];

const NotificationInboxTab = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [isRead, setIsRead] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching, isError, refetch } = useMyNotifications({
    page,
    limit: PAGE_SIZE,
    ...(isRead ? { isRead } : {}),
  });
  const { mutate: markRead } = useMarkNotificationRead();
  const { mutate: markAllRead, isPending: isMarkingAll } = useMarkAllNotificationsRead();

  const notifications = data?.data ?? [];
  const meta = data?.meta;
  const homePath = getDashboardHomePath(user);

  const handleFilterChange = (value) => {
    setIsRead(value);
    setPage(1);
  };

  const handleClick = (notification) => {
    if (!notification.isRead) markRead(notification.id);
    if (notification.fileId) {
      navigate(`${homePath}/files/${notification.fileId}`, { state: { initialTab: "timeline" } });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => handleFilterChange(filter.value)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                isRead === filter.value ? "bg-primaryBlue text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {filter.label}
              {filter.value === "false" && meta?.unreadCount > 0 ? ` (${meta.unreadCount})` : ""}
            </button>
          ))}
        </div>
        {meta?.unreadCount > 0 && (
          <button
            type="button"
            onClick={() => markAllRead()}
            disabled={isMarkingAll}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primaryBlue hover:underline disabled:opacity-50"
          >
            <CheckCheck size={15} />
            Mark all read
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-2xl bg-gray-100" />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center">
          <p className="text-sm text-red-600">Unable to load notifications.</p>
          <button type="button" onClick={() => refetch()} className="mt-1.5 text-sm font-semibold text-red-700 hover:underline">
            Try again
          </button>
        </div>
      ) : notifications.length ? (
        <div className={`rounded-2xl border border-gray-100 bg-white divide-y divide-gray-50 shadow-sm transition-opacity ${isFetching ? "opacity-60" : "opacity-100"}`}>
          {notifications.map((notification) => {
            const meta2 = getNotificationMeta(notification.type);
            const Icon = meta2.icon;
            return (
              <button
                key={notification.id}
                type="button"
                onClick={() => handleClick(notification)}
                className={`flex w-full items-start gap-3.5 px-5 py-4 text-left transition-colors hover:bg-gray-50 ${
                  !notification.isRead ? "bg-primaryBlueLight/30" : ""
                }`}
              >
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${meta2.toneClass}`}>
                  <Icon size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className={`text-sm ${!notification.isRead ? "font-semibold text-gray-900" : "text-gray-700"}`}>{notification.title}</p>
                    <span className="shrink-0 text-xs text-gray-400">{dayjs(notification.createdAt).fromNow()}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">{notification.message}</p>
                </div>
                {!notification.isRead && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primaryBlue" />}
              </button>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title={isRead === "false" ? "No unread notifications" : "No notifications yet"}
          message="Activity that involves you will show up here."
          icon={Inbox}
        />
      )}

      {!isLoading && !isError && meta && meta.totalPages > 1 && (
        <DataPagination currentPage={meta.page} totalPages={meta.totalPages} totalItems={meta.total} pageSize={PAGE_SIZE} onPageChange={setPage} />
      )}
    </div>
  );
};

export default NotificationInboxTab;
