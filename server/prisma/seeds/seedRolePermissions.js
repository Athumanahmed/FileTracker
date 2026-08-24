import prisma from "../../config/prisma.js";

/**
 * Permissions SYSTEM_ADMIN must NOT receive from the blanket grant below.
 * Two different reasons land a permission on this list:
 *
 *  - USERS.CREATE.SUPER_ADMIN / USERS.CREATE.OFFICER: escalation-risk
 *    overrides that config/organizationalHierarchy.js's ROLE_CREATION_MATRIX
 *    *does* list as valid for SYSTEM_ADMIN, but which must stay opt-in --
 *    grant explicitly later (via a role-management UI) only if the
 *    business genuinely needs the override.
 *
 *  - USERS.CREATE.SUPERVISOR: NOT an override at all. The matrix only
 *    ever lists HOD as allowed to create a SUPERVISOR (department-scoped,
 *    no admin bypass exists for this one). Granting the permission bit to
 *    SYSTEM_ADMIN here would be pointless and misleading -- authorize()
 *    would let the request through, then the service's independent
 *    ROLE_CREATION_MATRIX check would still reject it, producing a
 *    confusing 403 despite /me listing the permission as held.
 *
 *  - FILES.REGISTER: SYSTEM_ADMIN is view-only over the file registry.
 *    Registration stays Registry-Officer-only (see REGISTRY_PERMISSIONS
 *    below); admin keeps FILES.READ from the blanket grant.
 */
const NEVER_GRANT_TO_SYSTEM_ADMIN = [
  "USERS.CREATE.SUPER_ADMIN",
  "USERS.CREATE.OFFICER",
  "USERS.CREATE.SUPERVISOR",
  "FILES.REGISTER",
];

/**
 * Permissions granted to non-SYSTEM_ADMIN roles, keyed by role code.
 * This is where the "who can create whom" hierarchy actually gets wired
 * into the database -- see config/organizationalHierarchy.js for the
 * matrix this mirrors. Account-management permissions (activate/
 * deactivate/lock/unlock/reset-password/assign-role/remove-role) are
 * granted alongside the creation permission for the same reason: an HOD
 * administers their own department's people end-to-end, not just at
 * creation time; a Supervisor the same for their own unit. The actual
 * "which specific user can this actor touch" containment check happens
 * at request time (userScope.service.js's assertTargetWithinScope), not here.
 */
const ACCOUNT_MANAGEMENT_PERMISSIONS = [
  "USERS.ACTIVATE",
  "USERS.DEACTIVATE",
  "USERS.LOCK",
  "USERS.UNLOCK",
  "USERS.RESET_PASSWORD",
  "USERS.ROLES.ASSIGN",
  "USERS.ROLES.REMOVE",
];

/**
 * USERS.READ, DASHBOARD.READ_SCOPED_SUMMARY, and ROLES.READ are shared by
 * both roles -- the endpoints behind them (adminUserQuery.service.js,
 * dashboard.service.js's getScopedSummary/getScopedRecentActivity) auto-scope
 * to the actor's own department/unit server-side (see
 * userScope.service.js#resolveActorScope), so granting the same permission
 * bit to HOD and SUPERVISOR is safe -- it never exposes data outside their
 * own scope. ROLES.READ specifically powers the Users directory's role
 * filter dropdown (the Role catalog itself isn't scoped -- there's nothing
 * department/unit-specific to leak). UNITS.READ is HOD-only: the Create
 * Supervisor form needs to populate a Unit dropdown scoped to the HOD's own
 * department; Supervisor's Create Officer form has no org picker at all
 * (both department and unit are server-injected), so it doesn't need it.
 */
const SCOPED_READ_PERMISSIONS = ["USERS.READ", "DASHBOARD.READ_SCOPED_SUMMARY", "ROLES.READ"];

/**
 * File Registration (Phase 2) is Registry-Officer-only. SYSTEM_ADMIN is
 * explicitly excluded from FILES.REGISTER (see NEVER_GRANT_TO_SYSTEM_ADMIN
 * above) -- admin can view the registry but not register into it.
 * Registry also drives the workflow engine (Phase 4): they route a newly
 * registered file into its workflow and can act on it like anyone else
 * it's assigned to.
 */
const REGISTRY_PERMISSIONS = [
  "FILES.REGISTER",
  "FILES.READ",
  "FILE_CATEGORIES.READ",
  // The registration form's Department dropdown -- read-only, no org
  // management access (creating/editing departments stays admin-only).
  "DEPARTMENTS.READ",
  "ATTACHMENTS.CREATE",
  "ATTACHMENTS.READ",
  "ATTACHMENTS.DOWNLOAD",
  "ATTACHMENTS.UPDATE",
  "ATTACHMENTS.DELETE",
  // Registry is the one routing a newly registered file into its workflow
  // (see startWorkflow's template picker in the UI), so -- unlike every
  // other workflow-assignee role -- it also needs to list templates.
  "WORKFLOW_TEMPLATES.READ",
  "WORKFLOW.MANAGE",
  "WORKFLOW.READ",
  "MINUTES.CREATE",
  "MINUTES.READ",
  "MINUTES.DELETE",
  "TIMELINE.READ",
  "ARCHIVE.READ",
  "REPORTS.READ",
];

/**
 * Any role a file's workflow can actually assign to (Phase 4) needs
 * enough access to see and act on what's been routed to them -- read the
 * file, its attachments, its minutes, and its timeline; drive the
 * workflow engine (forward/return/reassign/hold/resume/claim); and
 * record/attach their own minutes (Phase 5) -- an Officer writing a
 * decision routinely needs to attach supporting evidence to it, so
 * ATTACHMENTS.CREATE is granted here too. Replacing/deleting an
 * *existing* attachment stays Registry-only -- more sensitive than
 * adding a new one.
 */
const WORKFLOW_ASSIGNEE_PERMISSIONS = [
  "FILES.READ",
  "ATTACHMENTS.CREATE",
  "ATTACHMENTS.READ",
  "ATTACHMENTS.DOWNLOAD",
  "WORKFLOW.MANAGE",
  "WORKFLOW.READ",
  "MINUTES.CREATE",
  "MINUTES.READ",
  "MINUTES.DELETE",
  "TIMELINE.READ",
  "ARCHIVE.READ",
  "REPORTS.READ",
];

/**
 * Archive/retention management (Phase 10) is a real specialization, not
 * the usual "whoever can act on a file" access reality -- only the
 * Archive Officer role manages it. FILES.READ + TIMELINE.READ are needed
 * just to find and review a file before archiving it; ARCHIVE.MANAGE is
 * the actual archive/restore capability.
 */
const ARCHIVE_OFFICER_PERMISSIONS = ["FILES.READ", "TIMELINE.READ", "ARCHIVE.MANAGE", "ARCHIVE.READ"];

const EXPLICIT_ROLE_PERMISSIONS = {
  // The Municipal Director sits above HOD in the routing chain (Registry ->
  // Director -> HOD -> Supervisor -> Officer), so -- unlike the original
  // "reports only" design -- Director now also holds the same operational
  // workflow-assignee permissions as HOD/Supervisor/Officer, on top of its
  // global, unscoped reporting oversight (report.service.js only
  // department-scopes HOD, so DIRECTOR sees every department by default).
  DIRECTOR: ["REPORTS.READ", ...WORKFLOW_ASSIGNEE_PERMISSIONS],
  HOD: [
    "USERS.CREATE.SUPERVISOR",
    "UNITS.READ",
    ...SCOPED_READ_PERMISSIONS,
    ...ACCOUNT_MANAGEMENT_PERMISSIONS,
    ...WORKFLOW_ASSIGNEE_PERMISSIONS,
  ],
  SUPERVISOR: [
    "USERS.CREATE.OFFICER",
    ...SCOPED_READ_PERMISSIONS,
    ...ACCOUNT_MANAGEMENT_PERMISSIONS,
    ...WORKFLOW_ASSIGNEE_PERMISSIONS,
  ],
  OFFICER: [...WORKFLOW_ASSIGNEE_PERMISSIONS],
  REGISTRY: [...REGISTRY_PERMISSIONS],
  ARCHIVE: [...ARCHIVE_OFFICER_PERMISSIONS],
};

export async function seedRolePermissions() {
  console.log("Assigning permissions...");

  const roles = await prisma.role.findMany();
  const permissions = await prisma.permission.findMany();
  const permissionByCode = new Map(permissions.map((permission) => [permission.code, permission]));

  const grant = (roleId, permissionId) =>
    prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId, permissionId } },
      update: {},
      create: { roleId, permissionId },
    });

  const systemAdmin = roles.find((role) => role.code === "SYSTEM_ADMIN");
  if (systemAdmin) {
    for (const permission of permissions) {
      if (NEVER_GRANT_TO_SYSTEM_ADMIN.includes(permission.code)) continue;
      await grant(systemAdmin.id, permission.id);
    }

    // Revoke rather than just skip-grant, so re-seeding an already-seeded
    // DB (e.g. after NEVER_GRANT_TO_SYSTEM_ADMIN gains an entry) actually
    // removes a previously granted permission instead of leaving it stuck.
    const revokedIds = NEVER_GRANT_TO_SYSTEM_ADMIN.map((code) => permissionByCode.get(code)?.id).filter(Boolean);
    if (revokedIds.length) {
      await prisma.rolePermission.deleteMany({
        where: { roleId: systemAdmin.id, permissionId: { in: revokedIds } },
      });
    }
  }

  for (const [roleCode, permissionCodes] of Object.entries(EXPLICIT_ROLE_PERMISSIONS)) {
    const role = roles.find((r) => r.code === roleCode);
    if (!role) continue;

    for (const code of permissionCodes) {
      const permission = permissionByCode.get(code);
      if (!permission) continue;
      await grant(role.id, permission.id);
    }
  }

  console.log("Permissions assigned.");
}
