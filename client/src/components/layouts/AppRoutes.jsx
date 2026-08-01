import { Route, Routes } from "react-router-dom";
import Home from "../../pages/Home";
import About from "../../pages/About";
import Login from "../../pages/Login";
import ChangePassword from "../../pages/ChangePassword";
import ForgotPassword from "../../pages/ForgotPassword";
import VerifyOtp from "../../pages/VerifyOtp";
import ResetPassword from "../../pages/ResetPassword";
import NotAuthorized from "../../pages/NotAuthorized";

import AppLayout from "./AppLayout";
import Protected from "./Protected";
import RoleBasedRoute from "./RoleBasedRoute";

import DashboardRedirect from "./DashboardRedirect";
import PlaceholderPage from "./PlaceholderPage";

import { ROLES } from "../../utils/roles";
import { PERMISSIONS } from "../../utils/permissions";
import AdminDashboard from "../../pages/admin/AdminDashboard";
import SystemUsers from "../../pages/admin/SystemUsers";
import CreateUser from "../../pages/admin/CreateUser";
import AllDepartments from "../../pages/admin/AllDepartments";
import CreateDepartment from "../../pages/admin/CreateDepartment";

/**
 * Every actor owns its own top-level branch (/admin, /hod, /registry, ...)
 * instead of being nested under a shared /dashboard prefix -- /dashboard
 * itself is never a page, just the role-aware redirector below that sends
 * a caller to their own branch (see dashboardHome.js).
 *
 * Each branch shares the same shell: must be logged in (Protected), must
 * hold the role (RoleBasedRoute), then AppLayout renders that role's
 * sidebar + header and an <Outlet /> for its nested pages. Each nested
 * page can be further permission-gated independently (see the admin
 * branch below) so a role missing an expected grant still can't reach a
 * module its permissions don't cover.
 */
const actorShell = (role) => (
  <Protected>
    <RoleBasedRoute allowedRoles={[role]}>
      <AppLayout />
    </RoleBasedRoute>
  </Protected>
);

// System Admin is the only role with its module tree structured so far --
// everything else gets a placeholder index page until its own routes
// (e.g. /hod/departments) are built, same as sidebarRoutes.js.
const OTHER_ROLE_DASHBOARDS = [
  { role: ROLES.DIRECTOR, path: "director", title: "Director Dashboard" },
  { role: ROLES.HOD, path: "hod", title: "Head of Department Dashboard" },
  { role: ROLES.REGISTRY, path: "registry", title: "Registry Dashboard" },
  { role: ROLES.SUPERVISOR, path: "supervisor", title: "Supervisor Dashboard" },
  { role: ROLES.OFFICER, path: "officer", title: "Officer Dashboard" },
  { role: ROLES.ARCHIVE, path: "archive", title: "Archive Dashboard" },
  {
    role: ROLES.ICT_ADMIN,
    path: "ict-admin",
    title: "ICT Administration Dashboard",
  },
];

const AppRoutes = (
  <Routes>
    <Route path="/">
      <Route index element={<Home />} />
      <Route path="about" element={<About />} />
      <Route path="login" element={<Login />} />
      <Route path="change-password" element={<ChangePassword />} />
      <Route path="forgot-password" element={<ForgotPassword />} />
      <Route path="verify-otp" element={<VerifyOtp />} />
      <Route path="reset-password" element={<ResetPassword />} />
      <Route path="not-authorized" element={<NotAuthorized />} />

      {/* /dashboard -- redirects to the caller's own branch, nothing else. */}
      <Route
        path="dashboard"
        element={
          <Protected>
            <DashboardRedirect />
          </Protected>
        }
      />

      {/* System Admin -- /admin, /admin/users, /admin/departments, ... */}
      <Route path="admin" element={actorShell(ROLES.SYSTEM_ADMIN)}>
        <Route index element={<AdminDashboard />} />
        <Route
          path="users"
          element={
            <RoleBasedRoute requiredPermission={PERMISSIONS.USERS_READ}>
              <SystemUsers />
            </RoleBasedRoute>
          }
        />

        <Route
          path="create-users"
          element={
            <RoleBasedRoute requiredPermission={PERMISSIONS.USERS_READ}>
              <CreateUser />
            </RoleBasedRoute>
          }
        />
        <Route
          path="departments"
          element={
            <RoleBasedRoute requiredPermission={PERMISSIONS.DEPARTMENTS_READ}>
              <AllDepartments />
            </RoleBasedRoute>
          }
        />
        <Route
          path="create-department"
          element={
            <RoleBasedRoute requiredPermission={PERMISSIONS.DEPARTMENTS_CREATE}>
              <CreateDepartment />
            </RoleBasedRoute>
          }
        />
        <Route
          path="units"
          element={
            <RoleBasedRoute requiredPermission={PERMISSIONS.UNITS_READ}>
              <PlaceholderPage
                title="Units"
                description="Unit management is coming soon."
              />
            </RoleBasedRoute>
          }
        />
        <Route
          path="positions"
          element={
            <RoleBasedRoute requiredPermission={PERMISSIONS.POSITIONS_READ}>
              <PlaceholderPage
                title="Positions"
                description="Position management is coming soon."
              />
            </RoleBasedRoute>
          }
        />
        <Route
          path="roles"
          element={
            <RoleBasedRoute requiredPermission={PERMISSIONS.ROLES_READ}>
              <PlaceholderPage
                title="Roles"
                description="Role management is coming soon."
              />
            </RoleBasedRoute>
          }
        />
        <Route
          path="permissions"
          element={
            <RoleBasedRoute requiredPermission={PERMISSIONS.PERMISSIONS_READ}>
              <PlaceholderPage
                title="Permissions"
                description="Permission catalog management is coming soon."
              />
            </RoleBasedRoute>
          }
        />
        <Route
          path="role-permissions"
          element={
            <RoleBasedRoute
              requiredPermission={PERMISSIONS.ROLE_PERMISSIONS_READ}
            >
              <PlaceholderPage
                title="Role Permissions"
                description="Role-to-permission assignment is coming soon."
              />
            </RoleBasedRoute>
          }
        />
        {/* No dedicated backend permission for these two yet -- the parent
            SYSTEM_ADMIN role guard above is the only gate, same as the
            admin index route. */}
        <Route
          path="audit-logs"
          element={
            <PlaceholderPage
              title="Audit Logs"
              description="The full activity log viewer is coming soon."
            />
          }
        />
        <Route
          path="settings"
          element={
            <PlaceholderPage
              title="System Settings"
              description="System settings are coming soon."
            />
          }
        />
      </Route>

      {/* Every other actor -- own top-level branch, structured one at a time. */}
      {OTHER_ROLE_DASHBOARDS.map(({ role, path, title }) => (
        <Route key={role} path={path} element={actorShell(role)}>
          <Route
            index
            element={
              <PlaceholderPage
                title={title}
                description="Your dashboard is being tailored for your role."
              />
            }
          />
        </Route>
      ))}
    </Route>
  </Routes>
);

export default AppRoutes;
