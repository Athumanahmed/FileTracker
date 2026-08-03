import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Monitor, ShieldCheck, LogOut, Loader2, X } from "lucide-react";
import EmptyState from "../shared/EmptyState";
import useAuthStore from "../../store/authStore";
import { useMySessions } from "../../hooks/useMySessions";
import { useRevokeSession } from "../../hooks/useRevokeSession";
import { useLogoutAllDevices } from "../../hooks/useLogoutAllDevices";

dayjs.extend(relativeTime);

/** Active sessions across every device -- backed by GET/DELETE /auth/sessions, built and wired to the database since Phase 0 but never used by any page until now. */
const SessionsCard = () => {
  const navigate = useNavigate();
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const { data: sessions, isLoading, isError, refetch } = useMySessions();
  const { mutate: revoke, isPending: isRevoking, variables: revokingId } = useRevokeSession();
  const { mutate: logoutAll, isPending: isLoggingOutAll } = useLogoutAllDevices();

  const handleRevoke = (session) => {
    if (!window.confirm(`Sign out "${session.deviceName || session.browser || "this device"}"?`)) return;
    revoke(session.id, {
      onSuccess: () => toast.success("Session revoked."),
      onError: (error) => toast.error(error?.response?.data?.message || "Unable to revoke session."),
    });
  };

  const handleLogoutAll = () => {
    if (!window.confirm("Sign out of every device, including this one? You'll need to log in again.")) return;
    logoutAll(undefined, {
      onSuccess: () => {
        clearAuth();
        toast.success("Signed out of all devices.");
        navigate("/login", { replace: true });
      },
      onError: (error) => toast.error(error?.response?.data?.message || "Unable to sign out of all devices."),
    });
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="flex items-start justify-between gap-3 border-b border-gray-100 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primaryBlueLight text-primaryBlue">
            <ShieldCheck size={20} />
          </span>
          <div>
            <h2 className="font-bold text-gray-900">Active Sessions</h2>
            <p className="text-sm text-gray-500 mt-0.5">Devices currently signed in to your account.</p>
          </div>
        </div>
        {sessions?.length > 1 && (
          <button
            type="button"
            onClick={handleLogoutAll}
            disabled={isLoggingOutAll}
            className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-red-200 px-3.5 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors disabled:opacity-60 shrink-0"
          >
            {isLoggingOutAll ? <Loader2 size={14} className="animate-spin" /> : <LogOut size={14} />}
            Sign Out All Devices
          </button>
        )}
      </div>

      <div className="p-5 sm:p-6">
        {isLoading ? (
          <div className="space-y-3 animate-pulse">
            {[0, 1].map((i) => (
              <div key={i} className="h-16 rounded-xl bg-gray-100" />
            ))}
          </div>
        ) : isError ? (
          <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-center">
            <p className="text-sm text-red-600">Unable to load your sessions.</p>
            <button type="button" onClick={() => refetch()} className="mt-1 text-sm font-semibold text-red-700 hover:underline">
              Try again
            </button>
          </div>
        ) : sessions?.length ? (
          <div className="divide-y divide-gray-50">
            {sessions.map((session) => (
              <div key={session.id} className="flex items-center gap-3.5 py-3.5 first:pt-0 last:pb-0">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                  <Monitor size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {[session.browser, session.operatingSystem].filter(Boolean).join(" on ") || session.deviceName || "Unknown device"}
                    </p>
                    {session.isCurrent && (
                      <span className="shrink-0 rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-semibold text-green-700">This device</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {session.ipAddress ? `${session.ipAddress} · ` : ""}
                    Active {dayjs(session.lastActivityAt).fromNow()}
                  </p>
                </div>
                {!session.isCurrent && (
                  <button
                    type="button"
                    onClick={() => handleRevoke(session)}
                    disabled={isRevoking && revokingId === session.id}
                    aria-label={`Sign out ${session.deviceName || "this device"}`}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-50"
                  >
                    {isRevoking && revokingId === session.id ? <Loader2 size={15} className="animate-spin" /> : <X size={15} />}
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No active sessions" message="You aren't signed in anywhere right now." icon={ShieldCheck} />
        )}

        {sessions?.length > 1 && (
          <button
            type="button"
            onClick={handleLogoutAll}
            disabled={isLoggingOutAll}
            className="sm:hidden mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-red-200 px-3.5 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors disabled:opacity-60"
          >
            {isLoggingOutAll ? <Loader2 size={14} className="animate-spin" /> : <LogOut size={14} />}
            Sign Out All Devices
          </button>
        )}
      </div>
    </div>
  );
};

export default SessionsCard;
