import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useClickAway } from "react-use";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Bell, CheckCheck, Inbox } from "lucide-react";
import useAuthStore from "../../store/authStore";
import { getDashboardHomePath } from "../../utils/dashboardHome";
import { getNotificationMeta } from "../../utils/notificationMeta";
import { useMyNotifications } from "../../hooks/useMyNotifications";
import { useMarkNotificationRead } from "../../hooks/useMarkNotificationRead";
import { useMarkAllNotificationsRead } from "../../hooks/useMarkAllNotificationsRead";

dayjs.extend(relativeTime);

const PREVIEW_LIMIT = 6;

/** Header dropdown: unread badge + recent-notifications preview. The full inbox lives at <role home>/notifications. */
const NotificationBell = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  useClickAway(menuRef, () => setIsOpen(false));

  const { data, isLoading } = useMyNotifications({ limit: PREVIEW_LIMIT });
  const { mutate: markRead } = useMarkNotificationRead();
  const { mutate: markAllRead, isPending: isMarkingAll } = useMarkAllNotificationsRead();

  const notifications = data?.data ?? [];
  const unreadCount = data?.meta?.unreadCount ?? 0;
  const homePath = getDashboardHomePath(user);

  const handleItemClick = (notification) => {
    if (!notification.isRead) markRead(notification.id);
    setIsOpen(false);
    if (notification.fileId) {
      navigate(`${homePath}/files/${notification.fileId}`, { state: { initialTab: "timeline" } });
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label="Notifications"
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      <div
        role="menu"
        aria-hidden={!isOpen}
        className={`absolute right-0 z-50 w-80 sm:w-96 origin-top-right overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-md transition-all duration-200 ease-in-out ${
          isOpen ? "opacity-100 scale-100 translate-y-0" : "pointer-events-none opacity-0 scale-95 -translate-y-1"
        }`}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <p className="text-sm font-semibold text-gray-900">Notifications</p>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllRead()}
              disabled={isMarkingAll}
              className="inline-flex items-center gap-1 text-xs font-medium text-primaryBlue hover:underline disabled:opacity-50"
            >
              <CheckCheck size={13} />
              Mark all read
            </button>
          )}
        </div>

        <div className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="space-y-3 p-4 animate-pulse">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-10 rounded-lg bg-gray-100" />
              ))}
            </div>
          ) : notifications.length ? (
            notifications.map((notification) => {
              const meta = getNotificationMeta(notification.type);
              const Icon = meta.icon;
              return (
                <button
                  key={notification.id}
                  onClick={() => handleItemClick(notification)}
                  className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 ${
                    !notification.isRead ? "bg-primaryBlueLight/40" : ""
                  }`}
                >
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${meta.toneClass}`}>
                    <Icon size={14} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm truncate ${!notification.isRead ? "font-semibold text-gray-900" : "text-gray-700"}`}>
                      {notification.title}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{notification.message}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{dayjs(notification.createdAt).fromNow()}</p>
                  </div>
                  {!notification.isRead && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primaryBlue" />}
                </button>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Inbox className="text-gray-300" size={26} />
              <p className="mt-2 text-sm text-gray-400">You're all caught up.</p>
            </div>
          )}
        </div>

        <button
          onClick={() => {
            setIsOpen(false);
            navigate(`${homePath}/notifications`);
          }}
          className="block w-full border-t border-gray-100 px-4 py-2.5 text-center text-xs font-semibold text-primaryBlue hover:bg-gray-50 transition-colors"
        >
          View All Notifications
        </button>
      </div>
    </div>
  );
};

export default NotificationBell;
