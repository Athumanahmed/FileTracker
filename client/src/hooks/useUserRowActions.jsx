import { useCallback, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { UserCheck, UserX, Lock, LockOpen, KeyRound } from "lucide-react";
import { createUserTableColumns } from "../components/users/userTableColumns";
import EditUserModal from "../components/users/EditUserModal";
import ConfirmAccountActionModal from "../components/users/ConfirmAccountActionModal";
import ResetPasswordResultModal from "../components/users/ResetPasswordResultModal";
import { useAdminAccountStatusAction } from "./useAdminAccountStatusAction";
import { useResetAdminUserPassword } from "./useResetAdminUserPassword";
import { activateAdminUser, deactivateAdminUser, lockAdminUser, unlockAdminUser } from "../utils/apiServices";
import useAuthStore from "../store/authStore";
import { PERMISSIONS } from "../utils/permissions";

const displayName = (user) => user.fullName || user.username;

/**
 * Everything a user row's actions need -- Edit/Activate/Deactivate/Lock/
 * Unlock/Reset Password modal state and mutations, plus the `columns` array
 * wired to all of it. Shared by SystemUsers.jsx (admin, global scope),
 * ScopedUsers.jsx (HOD/Supervisor, auto-scoped by the same backend
 * endpoints -- see adminUserQuery.service.js#applyActorScope), and
 * UserDetails.jsx (single-user page reached via View Details), so every
 * surface gets identical behavior instead of duplicating this wiring.
 * View Details itself isn't part of this hook -- it's a plain navigation
 * link (built from `basePath` in userTableColumns.jsx) to UserDetails.jsx,
 * not a modal/mutation. `basePath` (e.g. "/admin", "/hod") is only needed
 * to build that link, and is stable for the lifetime of the calling page.
 */
export const useUserRowActions = (basePath) => {
  // Edit User is admin-only in practice -- see PERMISSIONS.USERS_UPDATE's
  // own comment -- so ScopedUsers.jsx (HOD/Supervisor) gets every other row
  // action but not this one, rather than showing a button that always 403s.
  const currentUserPermissions = useAuthStore((state) => state.user?.permissions);
  const canEditUser = Boolean(currentUserPermissions?.includes(PERMISSIONS.USERS_UPDATE));

  const [editUser, setEditUser] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null); // { type, user }
  const [resetResult, setResetResult] = useState(null); // { username, newPassword }

  const activateMutation = useAdminAccountStatusAction(activateAdminUser);
  const deactivateMutation = useAdminAccountStatusAction(deactivateAdminUser);
  const lockMutation = useAdminAccountStatusAction(lockAdminUser);
  const unlockMutation = useAdminAccountStatusAction(unlockAdminUser);
  const resetPasswordMutation = useResetAdminUserPassword();

  const ACTION_CONFIG = {
    activate: {
      mutation: activateMutation,
      title: "Activate User",
      confirmLabel: "Activate",
      tone: "primary",
      icon: UserCheck,
      describe: (u) => `Restore access for ${displayName(u)}? They will be able to sign in again.`,
      successMessage: (u) => `${displayName(u)}'s account was activated.`,
    },
    deactivate: {
      mutation: deactivateMutation,
      title: "Deactivate User",
      confirmLabel: "Deactivate",
      tone: "danger",
      icon: UserX,
      describe: (u) =>
        `${displayName(u)} will be signed out of every active session and won't be able to sign back in until reactivated.`,
      successMessage: (u) => `${displayName(u)}'s account was deactivated.`,
    },
    lock: {
      mutation: lockMutation,
      title: "Lock Account",
      confirmLabel: "Lock Account",
      tone: "warning",
      icon: Lock,
      describe: (u) =>
        `${displayName(u)} will be signed out and blocked from signing in until this account is unlocked.`,
      successMessage: (u) => `${displayName(u)}'s account was locked.`,
    },
    unlock: {
      mutation: unlockMutation,
      title: "Unlock Account",
      confirmLabel: "Unlock Account",
      tone: "primary",
      icon: LockOpen,
      describe: (u) => `Allow ${displayName(u)} to sign in again.`,
      successMessage: (u) => `${displayName(u)}'s account was unlocked.`,
    },
    "reset-password": {
      mutation: resetPasswordMutation,
      title: "Reset Password",
      confirmLabel: "Reset Password",
      tone: "warning",
      icon: KeyRound,
      describe: (u) =>
        `Generate a new temporary password for ${displayName(u)}? Their current password will stop working immediately.`,
    },
  };

  const activeConfig = confirmAction ? ACTION_CONFIG[confirmAction.type] : null;

  const runConfirmedAction = useCallback(() => {
    if (!confirmAction) return;
    const { type, user } = confirmAction;
    const config = ACTION_CONFIG[type];

    config.mutation.mutate(user.id, {
      onSuccess: (data) => {
        setConfirmAction(null);
        if (type === "reset-password") {
          setResetResult(data);
        } else {
          toast.success(config.successMessage(user));
        }
      },
      onError: (error) => {
        toast.error(error?.response?.data?.message || "Unable to complete this action. Please try again.");
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirmAction]);

  // Stable handler identities + a memoized columns array -- DataTable feeds
  // `columns` straight into useReactTable, which re-derives its column defs
  // whenever the array's identity changes, so recreating it every render
  // (mutation objects are non-primitive and change reference each render)
  // would otherwise reset the table's column model on every keystroke/poll.
  const onEditUser = useCallback((user) => setEditUser(user), []);
  const onToggleActive = useCallback(
    (user) => setConfirmAction({ type: user.isActive ? "deactivate" : "activate", user }),
    [],
  );
  const onToggleLock = useCallback(
    (user) => setConfirmAction({ type: user.status === "LOCKED" ? "unlock" : "lock", user }),
    [],
  );
  const onResetPassword = useCallback((user) => setConfirmAction({ type: "reset-password", user }), []);

  const columns = useMemo(
    () =>
      createUserTableColumns({
        basePath,
        onEditUser,
        onToggleActive,
        onToggleLock,
        onResetPassword,
        canEditUser,
      }),
    [basePath, onEditUser, onToggleActive, onToggleLock, onResetPassword, canEditUser],
  );

  const modals = (
    <>
      {canEditUser && (
        <EditUserModal userId={editUser?.id} isOpen={Boolean(editUser)} onClose={() => setEditUser(null)} />
      )}
      {activeConfig && (
        <ConfirmAccountActionModal
          isOpen={Boolean(confirmAction)}
          onClose={() => setConfirmAction(null)}
          onConfirm={runConfirmedAction}
          isPending={activeConfig.mutation.isPending}
          title={activeConfig.title}
          description={activeConfig.describe(confirmAction.user)}
          confirmLabel={activeConfig.confirmLabel}
          icon={activeConfig.icon}
          tone={activeConfig.tone}
        />
      )}
      {resetResult && (
        <ResetPasswordResultModal
          username={resetResult.username}
          newPassword={resetResult.newPassword}
          onDone={() => {
            setResetResult(null);
            resetPasswordMutation.reset();
          }}
        />
      )}
    </>
  );

  return {
    columns,
    modals,
    canEditUser,
    onEditUser,
    onToggleActive,
    onToggleLock,
    onResetPassword,
  };
};
