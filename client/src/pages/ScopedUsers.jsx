import { useMemo, useState } from "react";
import { Users, Plus } from "lucide-react";
import PageHeader from "../components/shared/PageHeader";
import StatCard from "../components/shared/StatCard";
import DataTable from "../components/shared/DataTable";
import DataPagination from "../components/shared/DataPagination";
import ScopedUsersFilterBar from "../components/users/ScopedUsersFilterBar";
import { userTableColumns } from "../components/users/userTableColumns";
import { useAdminUsersList } from "../hooks/useAdminUsersList";
import { useAdminUserStats } from "../hooks/useAdminUserStats";
import useAuthStore from "../store/authStore";
import { getCreatableActorTypes } from "../utils/creatableActorTypes";
import { getDashboardHomePath } from "../utils/dashboardHome";

const DEFAULT_PAGE_SIZE = 10;

// The one actor type each of these roles can create -- who's allowed to
// see this button is decided by getCreatableActorTypes(user.permissions)
// below, not by role name; this map only supplies the label/path once
// that check has already said yes.
const CREATE_ACTION_BY_ROLE = {
  HOD: { roleCode: "SUPERVISOR", label: "Add Supervisor", path: "/hod/create-supervisor" },
  SUPERVISOR: { roleCode: "OFFICER", label: "Add Officer", path: "/supervisor/create-officer" },
};

/**
 * Shared Users directory for HOD (/hod/users) and Supervisor (/supervisor/users)
 * -- reuses the exact same list/stats hooks as the System Admin Users page
 * unchanged, since the roster and stats they return are now auto-scoped to
 * the caller's own department/unit server-side (see
 * adminUserQuery.service.js#applyActorScope). No department/unit filter
 * here, unlike the admin page -- there's nothing to filter across.
 */
const ScopedUsers = () => {
  const user = useAuthStore((state) => state.user);
  const primaryRoleCode = user?.roles?.[0]?.code;
  const createAction = CREATE_ACTION_BY_ROLE[primaryRoleCode];
  const canCreate =
    createAction && getCreatableActorTypes(user?.permissions).some((a) => a.roleCode === createAction.roleCode);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [roleCode, setRoleCode] = useState("");
  const [sorting, setSorting] = useState([]);
  const [resetKey, setResetKey] = useState(0);

  const withPageReset = (setter) => (value) => {
    setter(value);
    setPage(1);
  };

  const handleReset = () => {
    setSearch("");
    setStatus("");
    setRoleCode("");
    setPage(1);
    setResetKey((key) => key + 1);
  };

  const queryParams = useMemo(
    () => ({
      page,
      limit: pageSize,
      ...(search ? { search } : {}),
      ...(status ? { status } : {}),
      ...(roleCode ? { roleCode } : {}),
      ...(sorting.length > 0
        ? { sortBy: sorting[0].id, sortOrder: sorting[0].desc ? "desc" : "asc" }
        : {}),
    }),
    [page, pageSize, search, status, roleCode, sorting],
  );

  const { data, isLoading, isFetching, isError, error, refetch } = useAdminUsersList(queryParams);
  const { data: stats, isLoading: statsLoading, isError: statsError, refetch: refetchStats } = useAdminUserStats();

  const users = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="p-2 xl:p-4">
      <PageHeader
        title="Users"
        description="Manage the people within your organizational scope."
        breadcrumbs={[{ label: "Dashboard", to: getDashboardHomePath(user) }, { label: "Users" }]}
        primaryAction={
          canCreate ? { label: createAction.label, icon: Plus, to: createAction.path } : undefined
        }
      />

      {statsError ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-4 mb-6 text-center">
          <p className="text-sm text-red-600">Unable to load user statistics.</p>
          <button
            type="button"
            onClick={() => refetchStats()}
            className="mt-1.5 text-sm font-semibold text-red-700 hover:underline"
          >
            Try again
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <StatCard
            icon={Users}
            tone="blue"
            label="Total Users"
            value={stats?.total?.total}
            change={stats?.total?.changePercent}
            loading={statsLoading}
          />
          <StatCard
            icon={Users}
            tone="green"
            label="Active Users"
            value={stats?.active?.count}
            helperText={stats ? `${stats.active.percent}% of total` : undefined}
            loading={statsLoading}
          />
          <StatCard
            icon={Users}
            tone="amber"
            label="Inactive Users"
            value={stats?.inactive?.count}
            helperText={stats ? `${stats.inactive.percent}% of total` : undefined}
            loading={statsLoading}
          />
          <StatCard
            icon={Users}
            tone="red"
            label="Locked Users"
            value={stats?.locked?.count}
            helperText={stats ? `${stats.locked.percent}% of total` : undefined}
            loading={statsLoading}
          />
        </div>
      )}

      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm mb-6">
        <ScopedUsersFilterBar
          key={resetKey}
          search={search}
          onSearchChange={withPageReset(setSearch)}
          status={status}
          onStatusChange={withPageReset(setStatus)}
          roleCode={roleCode}
          onRoleChange={withPageReset(setRoleCode)}
          onReset={handleReset}
        />
      </div>

      <DataTable
        data={users}
        columns={userTableColumns}
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={refetch}
        manualSorting
        sorting={sorting}
        onSortingChange={setSorting}
        getRowId={(row) => row.id}
        emptyTitle="No users found"
        emptyMessage="Try adjusting your search or filters, or create a new user to get started."
        emptyIcon={Users}
      />

      {!isLoading && !isError && meta && (
        <div className={`mt-4 transition-opacity ${isFetching ? "opacity-60" : "opacity-100"}`}>
          <DataPagination
            currentPage={meta.page}
            totalPages={meta.totalPages}
            totalItems={meta.total}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default ScopedUsers;
