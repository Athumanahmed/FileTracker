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
import AllUnits from "../../pages/admin/AllUnits";
import CreateUnit from "../../pages/admin/CreateUnit";
import AllPositions from "../../pages/admin/AllPositions";
import CreatePosition from "../../pages/admin/CreatePosition";
import AllRoles from "../../pages/admin/AllRoles";
import CreateRole from "../../pages/admin/CreateRole";
import AllPermissions from "../../pages/admin/AllPermissions";
import CreatePermission from "../../pages/admin/CreatePermission";
import RolePermissions from "../../pages/admin/RolePermissions";
import ScopedDashboard from "../../pages/ScopedDashboard";
import ScopedUsers from "../../pages/ScopedUsers";
import CreateSupervisor from "../../pages/hod/CreateSupervisor";
import CreateOfficer from "../../pages/supervisor/CreateOfficer";
import Profile from "../../pages/Profile";
import Settings from "../../pages/Settings";
import Archive from "../../pages/Archive";
import RegistryDashboard from "../../pages/registry/RegistryDashboard";
import Files from "../../pages/Files";
import FileDetails from "../../pages/FileDetails";
import RegisterFile from "../../pages/RegisterFile";
import Workflow from "../../pages/Workflow";
import Reports from "../../pages/Reports";
import Notifications from "../../pages/Notifications";

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

// ICT_ADMIN holds no File Management (or any other) permissions yet -- a
// pre-existing gap outside this module's scope -- so it's the only role
// still left on the placeholder-index-only path.
const OTHER_ROLE_DASHBOARDS = [
  {
    role: ROLES.ICT_ADMIN,
    path: "ict-admin",
    title: "ICT Administration Dashboard",
  },
];

/**
 * File Lifecycle Management routes -- shared across every role (see
 * pages/Files.jsx etc.'s own docstrings for why each is role-agnostic).
 * Mirrors sidebarRoutes.js's item-per-role set exactly -- a role only gets
 * the nested <Route> here if it also gets the matching sidebar entry, so a
 * stray URL for a module a role can't see still 403s via RoleBasedRoute
 * rather than 404ing. Archive Officer still gets a PlaceholderPage since
 * its dedicated archive/retention UI isn't built yet.
 */
const filesRoute = (
  <Route
    path="files"
    element={
      <RoleBasedRoute requiredPermission={PERMISSIONS.FILES_READ}>
        <Files />
      </RoleBasedRoute>
    }
  />
);
const fileDetailsRoute = (
  <Route
    path="files/:fileId"
    element={
      <RoleBasedRoute requiredPermission={PERMISSIONS.FILES_READ}>
        <FileDetails />
      </RoleBasedRoute>
    }
  />
);
const registerFileRoute = (
  <Route
    path="files/new"
    element={
      <RoleBasedRoute requiredPermission={PERMISSIONS.FILES_REGISTER}>
        <RegisterFile />
      </RoleBasedRoute>
    }
  />
);
const workflowRoute = (
  <Route
    path="workflow"
    element={
      <RoleBasedRoute requiredPermission={PERMISSIONS.WORKFLOW_READ}>
        <Workflow />
      </RoleBasedRoute>
    }
  />
);
const archiveRoute = (
  <Route
    path="archive"
    element={
      <RoleBasedRoute requiredPermission={PERMISSIONS.ARCHIVE_READ}>
        <Archive />
      </RoleBasedRoute>
    }
  />
);
const reportsRoute = (
  <Route
    path="reports"
    element={
      <RoleBasedRoute requiredPermission={PERMISSIONS.REPORTS_READ}>
        <Reports />
      </RoleBasedRoute>
    }
  />
);
// No dedicated permission -- every authenticated user gets a notification
// inbox, same as the backend endpoints (no permission check beyond auth).
const notificationsRoute = <Route path="notifications" element={<Notifications />} />;

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

      {/* /profile -- every authenticated user, any role, own account only. */}
      <Route
        path="profile"
        element={
          <Protected>
            <AppLayout />
          </Protected>
        }
      >
        <Route index element={<Profile />} />
      </Route>

      {/* /settings -- every authenticated user, any role, own account only (password + active sessions). */}
      <Route
        path="settings"
        element={
          <Protected>
            <AppLayout />
          </Protected>
        }
      >
        <Route index element={<Settings />} />
      </Route>

      {/* System Admin -- /admin, /admin/users, /admin/departments, ... */}
      <Route path="admin" element={actorShell(ROLES.SYSTEM_ADMIN)}>
        <Route index element={<AdminDashboard />} />
        {notificationsRoute}
        {filesRoute}
        {fileDetailsRoute}
        {registerFileRoute}
        {workflowRoute}
        {archiveRoute}
        {reportsRoute}
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
              <AllUnits />
            </RoleBasedRoute>
          }
        />
        <Route
          path="create-unit"
          element={
            <RoleBasedRoute requiredPermission={PERMISSIONS.UNITS_CREATE}>
              <CreateUnit />
            </RoleBasedRoute>
          }
        />
        <Route
          path="positions"
          element={
            <RoleBasedRoute requiredPermission={PERMISSIONS.POSITIONS_READ}>
              <AllPositions />
            </RoleBasedRoute>
          }
        />
        <Route
          path="create-position"
          element={
            <RoleBasedRoute requiredPermission={PERMISSIONS.POSITIONS_CREATE}>
              <CreatePosition />
            </RoleBasedRoute>
          }
        />
        <Route
          path="roles"
          element={
            <RoleBasedRoute requiredPermission={PERMISSIONS.ROLES_READ}>
              <AllRoles />
            </RoleBasedRoute>
          }
        />
        <Route
          path="create-role"
          element={
            <RoleBasedRoute requiredPermission={PERMISSIONS.ROLES_CREATE}>
              <CreateRole />
            </RoleBasedRoute>
          }
        />
        <Route
          path="permissions"
          element={
            <RoleBasedRoute requiredPermission={PERMISSIONS.PERMISSIONS_READ}>
              <AllPermissions />
            </RoleBasedRoute>
          }
        />
        <Route
          path="create-permission"
          element={
            <RoleBasedRoute requiredPermission={PERMISSIONS.PERMISSIONS_CREATE}>
              <CreatePermission />
            </RoleBasedRoute>
          }
        />
        <Route
          path="role-permissions"
          element={
            <RoleBasedRoute
              requiredPermission={PERMISSIONS.ROLE_PERMISSIONS_READ}
            >
              <RolePermissions />
            </RoleBasedRoute>
          }
        />
        <Route
          path="workflow-templates"
          element={
            <RoleBasedRoute requiredPermission={PERMISSIONS.WORKFLOW_TEMPLATES_READ}>
              <PlaceholderPage title="Workflow Templates" description="Workflow template and step configuration are coming soon." />
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

      {/* Head of Department -- /hod, /hod/users, /hod/create-supervisor. */}
      <Route path="hod" element={actorShell(ROLES.HOD)}>
        <Route index element={<ScopedDashboard />} />
        {notificationsRoute}
        {filesRoute}
        {fileDetailsRoute}
        {workflowRoute}
        {reportsRoute}
        <Route
          path="users"
          element={
            <RoleBasedRoute requiredPermission={PERMISSIONS.USERS_READ}>
              <ScopedUsers />
            </RoleBasedRoute>
          }
        />
        <Route
          path="create-supervisor"
          element={
            <RoleBasedRoute requiredPermission={PERMISSIONS.USERS_CREATE_SUPERVISOR}>
              <CreateSupervisor />
            </RoleBasedRoute>
          }
        />
      </Route>

      {/* Supervisor -- /supervisor, /supervisor/users, /supervisor/create-officer. */}
      <Route path="supervisor" element={actorShell(ROLES.SUPERVISOR)}>
        <Route index element={<ScopedDashboard />} />
        {notificationsRoute}
        {filesRoute}
        {fileDetailsRoute}
        {workflowRoute}
        {reportsRoute}
        <Route
          path="users"
          element={
            <RoleBasedRoute requiredPermission={PERMISSIONS.USERS_READ}>
              <ScopedUsers />
            </RoleBasedRoute>
          }
        />
        <Route
          path="create-officer"
          element={
            <RoleBasedRoute requiredPermission={PERMISSIONS.USERS_CREATE_OFFICER}>
              <CreateOfficer />
            </RoleBasedRoute>
          }
        />
      </Route>

      {/* Director -- /director, /director/files, /director/workflow, /director/reports. */}
      <Route path="director" element={actorShell(ROLES.DIRECTOR)}>
        <Route
          index
          element={<PlaceholderPage title="Director Dashboard" description="Your dashboard is being tailored for your role." />}
        />
        {notificationsRoute}
        {filesRoute}
        {fileDetailsRoute}
        {workflowRoute}
        {reportsRoute}
      </Route>

      {/* Registry -- /registry, /registry/files, /registry/files/new, /registry/workflow, /registry/reports. */}
      <Route path="registry" element={actorShell(ROLES.REGISTRY)}>
        <Route index element={<RegistryDashboard />} />
        {notificationsRoute}
        {filesRoute}
        {fileDetailsRoute}
        {registerFileRoute}
        {workflowRoute}
        {reportsRoute}
      </Route>

      {/* Officer -- /officer, /officer/files, /officer/workflow, /officer/reports. */}
      <Route path="officer" element={actorShell(ROLES.OFFICER)}>
        <Route
          index
          element={<PlaceholderPage title="Officer Dashboard" description="Your dashboard is being tailored for your role." />}
        />
        {notificationsRoute}
        {filesRoute}
        {fileDetailsRoute}
        {workflowRoute}
        {reportsRoute}
      </Route>

      {/* Archive Officer -- /archive, /archive/files, /archive/archive. No Workflow/Reports: not granted to this role. */}
      <Route path="archive" element={actorShell(ROLES.ARCHIVE)}>
        <Route
          index
          element={<PlaceholderPage title="Archive Dashboard" description="Your dashboard is being tailored for your role." />}
        />
        {notificationsRoute}
        {filesRoute}
        {fileDetailsRoute}
        {archiveRoute}
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
