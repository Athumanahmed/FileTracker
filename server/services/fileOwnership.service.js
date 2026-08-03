import { AppError } from "../utils/AppError.js";
import * as authRepository from "../repositories/auth.repository.js";

/**
 * Only the file's current holder may act on it (SYSTEM_ADMIN retains its
 * usual override). Shared by the workflow engine (Phase 4) and Minutes
 * (Phase 5) -- any module that gates an action on "do you currently hold
 * this file" reuses this rather than re-implementing the check.
 */
export const assertIsCurrentOwner = async ({ currentAssignment, actorId }) => {
  if (!currentAssignment) throw new AppError(409, "File has no current assignment");
  if (currentAssignment.assignedToId === actorId) return;

  const actor = await authRepository.findAuthenticatedUser(actorId);
  const isSystemAdmin = actor?.roles.some((r) => r.role.code === "SYSTEM_ADMIN");
  if (isSystemAdmin) return;

  throw new AppError(403, "Only the current holder of this file can perform this action");
};

/**
 * "Read Only" (Phase 10): an archived file accepts no further mutation --
 * no new attachments, minutes, or workflow. Restore first. Shared by
 * every module with a write path on a File (Attachments, Minutes,
 * Workflow) rather than re-implementing this one-line check everywhere.
 */
export const assertFileNotArchived = (file) => {
  if (file.status === "ARCHIVED") {
    throw new AppError(409, "This file is archived and read-only. Restore it first to make changes.");
  }
};
