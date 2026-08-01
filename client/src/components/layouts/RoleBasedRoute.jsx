import useAuthStore from "../../store/authStore";
import { Navigate } from "react-router-dom";

/**
 * Two independent, optional gates -- pass either or both:
 *  - allowedRoles: user.roles[].code must include one of these
 *  - requiredPermission: user.permissions[] must include this code
 * A route with neither prop just requires being logged in (Protected
 * already guarantees that upstream, so this becomes a no-op guard).
 */
const RoleBasedRoute = ({ allowedRoles, requiredPermission, children }) => {
  const user = useAuthStore((state) => state.user);

  if (!user) return <Navigate to="/login" replace />;

  const roleCodes = user.roles?.map((role) => role.code) ?? [];
  const hasAllowedRole = !allowedRoles || allowedRoles.some((role) => roleCodes.includes(role));
  const hasRequiredPermission =
    !requiredPermission || (user.permissions ?? []).includes(requiredPermission);

  if (!hasAllowedRole || !hasRequiredPermission) {
    return <Navigate to="/not-authorized" replace />;
  }

  return children;
};

export default RoleBasedRoute;
