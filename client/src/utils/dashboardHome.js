import { ROLES } from "./roles";

// Each actor lands on its own dashboard branch -- /dashboard itself is just
export const ROLE_HOME_PATHS = {
  [ROLES.SYSTEM_ADMIN]: "/admin",
  [ROLES.DIRECTOR]: "/director",
  [ROLES.HOD]: "/hod",
  [ROLES.REGISTRY]: "/registry",
  [ROLES.SUPERVISOR]: "/supervisor",
  [ROLES.OFFICER]: "/officer",
  [ROLES.ARCHIVE]: "/archive",
  [ROLES.ICT_ADMIN]: "/ict-admin",
};

/**
 * A user can technically hold more than one role (UserRole is many-to-many),
 * but the organizational hierarchy this app is built around assigns exactly
 * one -- so the first role is treated as the user's primary one for routing.
 */
export const getDashboardHomePath = (user) => {
  const roleCode = user?.roles?.[0]?.code;
  return ROLE_HOME_PATHS[roleCode] || "/not-authorized";
};
