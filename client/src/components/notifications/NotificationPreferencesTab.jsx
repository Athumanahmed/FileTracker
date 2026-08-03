import toast from "react-hot-toast";
import { MessageCircle } from "lucide-react";
import { PREFERENCE_ELIGIBLE_TYPES, getNotificationMeta } from "../../utils/notificationMeta";
import { useMyNotificationPreferences } from "../../hooks/useMyNotificationPreferences";
import { useSetNotificationPreference } from "../../hooks/useSetNotificationPreference";

/**
 * IN_APP is always-on by default and EMAIL/PUSH have no transport built yet
 * (see server/services/notification.service.js's fanOutToUser -- only
 * IN_APP and SMS actually deliver anything today), so SMS is the only
 * channel worth exposing a toggle for. Every other channel would be a
 * switch that visibly does nothing.
 */
const NotificationPreferencesTab = () => {
  const { data: preferences, isLoading } = useMyNotificationPreferences();
  const { mutate: setPreference } = useSetNotificationPreference();

  const isSmsEnabled = (type) => preferences?.some((p) => p.type === type && p.channel === "SMS" && p.isEnabled) ?? false;

  const handleToggle = (type, nextValue) => {
    setPreference(
      { type, channel: "SMS", isEnabled: nextValue },
      { onError: (error) => toast.error(error?.response?.data?.message || "Unable to update preference.") },
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-2 animate-pulse">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="h-14 rounded-2xl bg-gray-100" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-start gap-2.5 rounded-xl bg-primaryBlueLight px-4 py-3.5 mb-4">
        <MessageCircle className="mt-0.5 shrink-0 text-primaryBlue" size={16} />
        <p className="text-xs leading-relaxed text-gray-600">
          You always see notifications in-app. Turn on SMS for the events you don't want to miss even when you're not
          logged in — each text costs the council money, so it's opt-in per event type.
        </p>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white divide-y divide-gray-50 shadow-sm">
        {PREFERENCE_ELIGIBLE_TYPES.map((type) => {
          const meta = getNotificationMeta(type);
          const Icon = meta.icon;
          const enabled = isSmsEnabled(type);

          return (
            <div key={type} className="flex items-center justify-between gap-4 px-5 py-3.5">
              <div className="flex items-center gap-3 min-w-0">
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${meta.toneClass}`}>
                  <Icon size={15} />
                </span>
                <p className="text-sm font-medium text-gray-800 truncate">{meta.label}</p>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={enabled}
                aria-label={`SMS for ${meta.label}`}
                onClick={() => handleToggle(type, !enabled)}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                  enabled ? "bg-primaryBlue" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow transition-transform ${
                    enabled ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default NotificationPreferencesTab;
