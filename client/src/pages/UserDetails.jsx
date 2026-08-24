import { useParams } from "react-router-dom";
import {
  Mail,
  Phone,
  Building2,
  Users2,
  ShieldCheck,
  Clock,
  Calendar,
  IdCard,
  Pencil,
  UserCheck,
  UserX,
  Lock,
  LockOpen,
  KeyRound,
} from "lucide-react";
import PageHeader from "../components/shared/PageHeader";
import { useAdminUserDetail } from "../hooks/useAdminUserDetail";
import { useUserRowActions } from "../hooks/useUserRowActions";
import useAuthStore from "../store/authStore";
import { getDashboardHomePath } from "../utils/dashboardHome";
import { getInitials, formatDateTime } from "../utils/formatters";

const STATUS_DISPLAY = {
  ACTIVE: { label: "Active", tone: "green" },
  LOCKED: { label: "Locked", tone: "red" },
  PENDING_ACTIVATION: { label: "Pending", tone: "blue" },
  SUSPENDED: { label: "Suspended", tone: "amber" },
  DISABLED: { label: "Disabled", tone: "gray" },
  ARCHIVED: { label: "Archived", tone: "gray" },
};

const getStatusBadge = (user) => {
  if (!user.isActive) return { label: "Inactive", tone: "amber" };
  return STATUS_DISPLAY[user.status] || { label: user.status, tone: "gray" };
};

const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3 py-3">
    <Icon size={16} className="mt-0.5 shrink-0 text-gray-400" />
    <div className="min-w-0">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-sm font-medium text-gray-800 truncate">{value || "—"}</p>
    </div>
  </div>
);

const InfoCard = ({ title, children }) => (
  <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
    <div className="border-b border-gray-100 px-5 py-4">
      <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
    </div>
    <div className="divide-y divide-gray-100 px-5">{children}</div>
  </div>
);

/**
 * Shared across every role with USERS.READ -- reached via the Users
 * directory's "View Details" row action (see userTableColumns.jsx), which
 * links here instead of opening a modal so this can carry the full profile
 * plus the same row actions (Edit/Activate/Deactivate/Lock/Unlock/Reset
 * Password) with room to breathe. Mirrors FileDetails.jsx's structure --
 * one role-agnostic page, only the route prefix (breadcrumbs/back link)
 * varies by who's viewing it.
 */
const UserDetails = () => {
  const { userId } = useParams();
  const currentUser = useAuthStore((state) => state.user);
  const basePath = getDashboardHomePath(currentUser);
  const usersPath = `${basePath}/users`;

  const { data: user, isLoading, isError, refetch } = useAdminUserDetail(userId);
  const { modals, canEditUser, onEditUser, onToggleActive, onToggleLock, onResetPassword } =
    useUserRowActions(basePath);

  if (isLoading) {
    return (
      <div className="p-2 xl:p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-1/3 rounded bg-gray-200" />
          <div className="h-40 rounded-2xl bg-gray-100" />
        </div>
      </div>
    );
  }

  if (isError || !user) {
    return (
      <div className="p-2 xl:p-4">
        <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center">
          <p className="text-sm text-red-600">Unable to load this user.</p>
          <button type="button" onClick={() => refetch()} className="mt-1.5 text-sm font-semibold text-red-700 hover:underline">
            Try again
          </button>
        </div>
      </div>
    );
  }

  const isLocked = user.status === "LOCKED";
  const displayName = user.fullName || user.username;

  return (
    <div className="p-2 xl:p-4">
      <PageHeader
        title={displayName}
        description={`@${user.username}`}
        backTo={usersPath}
        badge={getStatusBadge(user)}
        breadcrumbs={[
          { label: "Dashboard", to: basePath },
          { label: "Users", to: usersPath },
          { label: displayName },
        ]}
        primaryAction={canEditUser ? { label: "Edit User", icon: Pencil, onClick: () => onEditUser(user) } : undefined}
        secondaryActions={[
          user.isActive
            ? { label: "Deactivate", icon: UserX, variant: "danger", onClick: () => onToggleActive(user) }
            : { label: "Activate", icon: UserCheck, onClick: () => onToggleActive(user) },
          isLocked
            ? { label: "Unlock Account", icon: LockOpen, onClick: () => onToggleLock(user) }
            : { label: "Lock Account", icon: Lock, onClick: () => onToggleLock(user) },
          { label: "Reset Password", icon: KeyRound, onClick: () => onResetPassword(user) },
        ]}
      />

      <div className="flex items-center gap-4 mb-6">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primaryBlueLight text-lg font-bold text-primaryBlue">
          {getInitials(displayName)}
        </span>
        {user.roles?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {user.roles.map((role) => (
              <span
                key={role.id}
                className="inline-flex items-center rounded-full bg-primaryBlueLight px-2.5 py-1 text-xs font-semibold text-primaryBlue"
              >
                {role.name}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <InfoCard title="Contact Information">
          <InfoRow icon={Mail} label="Email" value={user.email} />
          <InfoRow icon={Phone} label="Phone Number" value={user.phoneNumber} />
          <InfoRow icon={IdCard} label="Employee ID" value={user.employeeNumber} />
        </InfoCard>

        <InfoCard title="Organizational Assignment">
          <InfoRow icon={Building2} label="Department" value={user.department?.name} />
          <InfoRow icon={Users2} label="Unit" value={user.unit?.name} />
          <InfoRow icon={ShieldCheck} label="Position" value={user.position?.title} />
        </InfoCard>

        <InfoCard title="Account Activity">
          <InfoRow icon={Clock} label="Last Login" value={formatDateTime(user.lastLoginAt)} />
          <InfoRow icon={Calendar} label="Account Created" value={formatDateTime(user.createdAt)} />
          {user.createdBy && (
            <InfoRow icon={IdCard} label="Created By" value={user.createdBy.fullName || user.createdBy.username} />
          )}
        </InfoCard>

        <InfoCard title="Security">
          <InfoRow icon={ShieldCheck} label="Must Change Password" value={user.mustChangePassword ? "Yes" : "No"} />
          <InfoRow icon={Clock} label="Failed Login Attempts" value={user.failedLoginAttempts} />
          {isLocked && <InfoRow icon={Lock} label="Locked Until" value={formatDateTime(user.lockedUntil)} />}
        </InfoCard>
      </div>

      {modals}
    </div>
  );
};

export default UserDetails;
