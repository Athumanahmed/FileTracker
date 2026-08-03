import prisma from "../../config/prisma.js";

export async function seedPermissions() {
  console.log("Seeding permissions...");

  const permissions = [
    // Authentication
    { code: "AUTH.LOGIN", name: "Login", module: "AUTHENTICATION" },
    { code: "AUTH.LOGOUT", name: "Logout", module: "AUTHENTICATION" },

    // Users
    { code: "USERS.CREATE", name: "Create User", module: "USERS" },
    { code: "USERS.READ", name: "View Users", module: "USERS" },
    { code: "USERS.UPDATE", name: "Update User", module: "USERS" },
    { code: "USERS.DELETE", name: "Delete User", module: "USERS" },

    // User creation -- organizational hierarchy (see config/organizationalHierarchy.js).
    // Granular per-target-role permissions, distinct from the generic USERS.CREATE above.
    { code: "USERS.CREATE.DIRECTOR", name: "Create Municipal Director", module: "USERS" },
    { code: "USERS.CREATE.HOD", name: "Create Head of Department", module: "USERS" },
    { code: "USERS.CREATE.SUPERVISOR", name: "Create Unit Supervisor", module: "USERS" },
    { code: "USERS.CREATE.OFFICER", name: "Create Department Officer", module: "USERS" },
    { code: "USERS.CREATE.REGISTRY", name: "Create Registry Officer", module: "USERS" },
    { code: "USERS.CREATE.ARCHIVE", name: "Create Archive Officer", module: "USERS" },
    { code: "USERS.CREATE.ICT_ADMIN", name: "Create ICT Administrator", module: "USERS" },
    {
      code: "USERS.CREATE.SUPER_ADMIN",
      name: "Create Super Administrator",
      module: "USERS",
    },

    // User account management -- deliberately separate from USERS.UPDATE,
    // each one gates a distinct, independently-audited administrative action.
    { code: "USERS.ACTIVATE", name: "Activate User Account", module: "USERS" },
    { code: "USERS.DEACTIVATE", name: "Deactivate User Account", module: "USERS" },
    { code: "USERS.LOCK", name: "Lock User Account", module: "USERS" },
    { code: "USERS.UNLOCK", name: "Unlock User Account", module: "USERS" },
    { code: "USERS.RESET_PASSWORD", name: "Reset User Password", module: "USERS" },
    { code: "USERS.ROLES.ASSIGN", name: "Assign Role To User", module: "USERS" },
    { code: "USERS.ROLES.REMOVE", name: "Remove Role From User", module: "USERS" },

    // Roles
    { code: "ROLES.CREATE", name: "Create Role", module: "AUTHORIZATION" },
    { code: "ROLES.READ", name: "View Roles", module: "AUTHORIZATION" },
    { code: "ROLES.UPDATE", name: "Update Role", module: "AUTHORIZATION" },
    { code: "ROLES.DELETE", name: "Delete Role", module: "AUTHORIZATION" },

    // Permissions
    { code: "PERMISSIONS.CREATE", name: "Create Permission", module: "AUTHORIZATION" },
    { code: "PERMISSIONS.READ", name: "View Permissions", module: "AUTHORIZATION" },
    { code: "PERMISSIONS.UPDATE", name: "Update Permission", module: "AUTHORIZATION" },
    { code: "PERMISSIONS.DELETE", name: "Delete Permission", module: "AUTHORIZATION" },

    // Role <-> Permission assignments (the RolePermission join table has no
    // CRUD lifecycle of its own -- these are verb-based, not CRUD-based).
    { code: "ROLE_PERMISSIONS.READ", name: "View Role Permission Assignments", module: "AUTHORIZATION" },
    { code: "ROLE_PERMISSIONS.ASSIGN", name: "Assign Permission To Role", module: "AUTHORIZATION" },
    { code: "ROLE_PERMISSIONS.REVOKE", name: "Revoke Permission From Role", module: "AUTHORIZATION" },

    // Departments
    {
      code: "DEPARTMENTS.CREATE",
      name: "Create Department",
      module: "DEPARTMENTS",
    },
    {
      code: "DEPARTMENTS.READ",
      name: "View Departments",
      module: "DEPARTMENTS",
    },
    {
      code: "DEPARTMENTS.UPDATE",
      name: "Update Department",
      module: "DEPARTMENTS",
    },
    {
      code: "DEPARTMENTS.DELETE",
      name: "Delete Department",
      module: "DEPARTMENTS",
    },

    // Units
    { code: "UNITS.CREATE", name: "Create Unit", module: "UNITS" },
    { code: "UNITS.READ", name: "View Units", module: "UNITS" },
    { code: "UNITS.UPDATE", name: "Update Unit", module: "UNITS" },
    { code: "UNITS.DELETE", name: "Delete Unit", module: "UNITS" },

    // Positions
    { code: "POSITIONS.CREATE", name: "Create Position", module: "POSITIONS" },
    { code: "POSITIONS.READ", name: "View Positions", module: "POSITIONS" },
    { code: "POSITIONS.UPDATE", name: "Update Position", module: "POSITIONS" },
    { code: "POSITIONS.DELETE", name: "Delete Position", module: "POSITIONS" },

    // Dashboard -- aggregate views spanning multiple modules, so they get
    // their own permission rather than piggybacking on any single module's.
    {
      code: "DASHBOARD.READ_ADMIN_SUMMARY",
      name: "View Admin Dashboard Summary",
      module: "DASHBOARD",
    },
    // Shared by every DEPARTMENT/UNIT-scoped role (HOD, SUPERVISOR) -- the
    // response shape adapts to the actor's own scope (see
    // dashboard.service.js#getScopedSummary), so one permission code covers
    // both rather than one per role.
    {
      code: "DASHBOARD.READ_SCOPED_SUMMARY",
      name: "View Own Department/Unit Dashboard Summary",
      module: "DASHBOARD",
    },

    // Storage -- generic object storage endpoints (Phase 1). No business
    // module consumes these directly yet (Attachments lands in Phase 3),
    // so only SYSTEM_ADMIN holds them via the blanket grant in
    // seedRolePermissions.js; scoped roles will be granted a narrower
    // subset once a real upload UI exists.
    { code: "STORAGE.UPLOAD", name: "Upload Storage Object", module: "STORAGE" },
    { code: "STORAGE.READ", name: "View Storage Object Metadata", module: "STORAGE" },
    { code: "STORAGE.DOWNLOAD", name: "Download Storage Object", module: "STORAGE" },
    { code: "STORAGE.DELETE", name: "Delete Storage Object", module: "STORAGE" },

    // Files -- registration stays Registry-only (Phase 2's explicit rule).
    // FILES.READ is now also granted to HOD/SUPERVISOR/OFFICER (Phase 4) --
    // once the workflow engine can assign a file to them, they need to be
    // able to see it.
    { code: "FILES.REGISTER", name: "Register New File", module: "FILE_TRACKING" },
    { code: "FILES.READ", name: "View Files", module: "FILE_TRACKING" },

    // File categories -- read-only reference data in this phase; no
    // category management UI/permissions exist yet (see Future Improvements).
    { code: "FILE_CATEGORIES.READ", name: "View File Categories", module: "FILE_TRACKING" },

    // Attachments (Phase 3). Mutation (upload/replace/delete) stays
    // Registry-only for now; read/download extends to whoever a file can
    // be assigned to (Phase 4), so an assignee can actually see what
    // they've been sent.
    { code: "ATTACHMENTS.CREATE", name: "Upload File Attachment", module: "FILE_TRACKING" },
    { code: "ATTACHMENTS.READ", name: "View File Attachments", module: "FILE_TRACKING" },
    { code: "ATTACHMENTS.DOWNLOAD", name: "Download/Preview File Attachment", module: "FILE_TRACKING" },
    { code: "ATTACHMENTS.UPDATE", name: "Replace File Attachment", module: "FILE_TRACKING" },
    { code: "ATTACHMENTS.DELETE", name: "Delete File Attachment", module: "FILE_TRACKING" },

    // Workflow (Phase 4). Template/step design is an administrative,
    // system-wide config concern (SYSTEM_ADMIN only, via the blanket
    // grant). WORKFLOW.MANAGE/READ govern the engine itself (start a
    // file's workflow, move it between steps, claim a queued assignment)
    // and are held by Registry (who routes intake) and every role a file
    // can be assigned to (HOD/SUPERVISOR/OFFICER).
    { code: "WORKFLOW_TEMPLATES.CREATE", name: "Create Workflow Template", module: "WORKFLOW" },
    { code: "WORKFLOW_TEMPLATES.READ", name: "View Workflow Templates", module: "WORKFLOW" },
    { code: "WORKFLOW_TEMPLATES.UPDATE", name: "Update Workflow Template", module: "WORKFLOW" },
    { code: "WORKFLOW_TEMPLATES.DELETE", name: "Deactivate Workflow Template", module: "WORKFLOW" },
    { code: "WORKFLOW.MANAGE", name: "Start/Transition/Claim File Workflow", module: "WORKFLOW" },
    { code: "WORKFLOW.READ", name: "View File Workflow Status And Movement History", module: "WORKFLOW" },

    // Minutes (Phase 5) -- instructions/recommendations/approvals/decisions
    // recorded on a file. Same access reality as everything else: whoever
    // can hold and act on a file can write on it too.
    { code: "MINUTES.CREATE", name: "Write File Minute", module: "FILE_TRACKING" },
    { code: "MINUTES.READ", name: "View File Minutes (Decision History)", module: "FILE_TRACKING" },
    { code: "MINUTES.DELETE", name: "Delete File Minute", module: "FILE_TRACKING" },

    // Timeline (Phase 7) -- read-only permanent history, populated by the
    // domain-event subscriber (registerTimelineSubscriber). Same access
    // reality as Minutes: whoever can see a file can see its timeline.
    { code: "TIMELINE.READ", name: "View File Timeline", module: "FILE_TRACKING" },

    // Archive (Phase 10) -- a real specialization, not the usual "whoever
    // can act on a file" access reality: only the Archive Officer role
    // (already seeded in seedRoles.js) manages retention/archive/restore.
    { code: "ARCHIVE.MANAGE", name: "Archive/Restore File", module: "ARCHIVE" },
    { code: "ARCHIVE.READ", name: "View Archive Status And Retention Records", module: "ARCHIVE" },

    // Reports & Dashboard (Phase 11) -- KPIs, department/officer
    // performance, charts, and CSV/Excel/PDF export. Scoping (HOD sees
    // only their own department, Officer sees only their own row) is
    // enforced inside report.service.js, not by separate permission codes.
    { code: "REPORTS.READ", name: "View Reports And Dashboard", module: "REPORTS" },
  ];

  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: { code: permission.code },
      update: {},
      create: permission,
    });
  }

  console.log("Permissions seeded.");
}
