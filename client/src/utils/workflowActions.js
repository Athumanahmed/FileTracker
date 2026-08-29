/**
 * Human-readable labels for every workflow action, shared by the file
 * workflow "Take Action" panel and the template step editor.
 */
export const WORKFLOW_ACTION_LABELS = {
  REGISTER: "Register",
  FORWARD: "Forward",
  RETURN: "Return",
  REASSIGN: "Reassign",
  APPROVE: "Approve",
  REJECT: "Reject",
  REQUEST_INFORMATION: "Request Information",
  HOLD: "Put On Hold",
  RESUME: "Resume",
  COMPLETE: "Complete",
  ARCHIVE: "Archive",
  CLOSE: "Close",
};

/**
 * The actions a step's `allowedActions` can actually gate. The engine
 * (workflowEngine.service.js#isActionAllowedAtStep) only consults
 * allowedActions for these routing/decision actions -- HOLD, RESUME,
 * COMPLETE and CLOSE are always available regardless of the step. An empty
 * allowedActions list means "all of these are permitted".
 */
export const GATED_STEP_ACTIONS = [
  "FORWARD",
  "RETURN",
  "REASSIGN",
  "APPROVE",
  "REJECT",
  "REQUEST_INFORMATION",
];
