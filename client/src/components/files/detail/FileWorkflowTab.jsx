import { useState } from "react";
import toast from "react-hot-toast";
import { Workflow, Play, Send, User, Building2, CalendarClock, History, Hand, Loader2 } from "lucide-react";
import BaseInput from "../../shared/BaseInput";
import { formatDateTime } from "../../../utils/formatters";
import useAuthStore from "../../../store/authStore";
import { useFileWorkflowStatus } from "../../../hooks/useFileWorkflowStatus";
import { useWorkflowTemplatesList } from "../../../hooks/useWorkflowTemplatesList";
import { useStartWorkflow } from "../../../hooks/useStartWorkflow";
import { useWorkflowTransition } from "../../../hooks/useWorkflowTransition";
import { useClaimWorkflowAssignment } from "../../../hooks/useClaimWorkflowAssignment";
import { useEligibleWorkflowTargets } from "../../../hooks/useEligibleWorkflowTargets";
import { useFileMovements } from "../../../hooks/useFileMovements";

const ACTION_LABELS = {
  FORWARD: "Forward",
  RETURN: "Return",
  REASSIGN: "Reassign",
  HOLD: "Put On Hold",
  RESUME: "Resume",
  APPROVE: "Approve",
  REJECT: "Reject",
  REQUEST_INFORMATION: "Request Information",
  COMPLETE: "Complete",
  CLOSE: "Close",
};

const STATE_BADGES = {
  IN_PROGRESS: "bg-blue-50 text-blue-700",
  ON_HOLD: "bg-amber-50 text-amber-700",
  COMPLETED: "bg-green-50 text-green-700",
  REJECTED: "bg-red-50 text-red-700",
};

const TARGET_REQUIRED_ACTIONS = ["FORWARD", "RETURN", "REASSIGN", "REQUEST_INFORMATION"];

/** Empty allowedActions on a step means permissive (every gated action allowed) -- mirrors server's isActionAllowedAtStep. */
const isAllowedAtStep = (step, action) => !step?.allowedActions?.length || step.allowedActions.includes(action);

/** Mirrors workflowEngine.service.js's TRANSITION_HANDLERS state/step gating exactly, so this list never offers an action the API would reject. */
const getAvailableActions = (instance) => {
  if (!instance) return [];
  if (instance.state === "ON_HOLD") return ["RESUME", "CLOSE"];
  if (instance.state !== "IN_PROGRESS") return [];
  const step = instance.currentStep;
  const gated = ["FORWARD", "RETURN", "REASSIGN", "APPROVE", "REJECT", "REQUEST_INFORMATION"].filter((action) => {
    if (action === "FORWARD" && step?.isFinalStep) return false;
    return isAllowedAtStep(step, action);
  });
  return [...gated, "HOLD", "COMPLETE", "CLOSE"];
};

const actionNeedsTarget = (action, step) => TARGET_REQUIRED_ACTIONS.includes(action) || (action === "APPROVE" && !step?.isFinalStep);

const InfoRow = ({ icon: Icon, label, value, valueClassName = "text-gray-900" }) => (
  <div className="flex items-center justify-between gap-4 py-2">
    <span className="flex items-center gap-2 text-sm text-gray-500">
      <Icon size={15} className="text-gray-400" />
      {label}
    </span>
    <span className={`text-sm font-medium text-right ${valueClassName}`}>{value ?? "—"}</span>
  </div>
);

const StartWorkflowPanel = ({ fileId }) => {
  const [templateId, setTemplateId] = useState("");
  const [remarks, setRemarks] = useState("");
  const { data: templatesData, isLoading: templatesLoading } = useWorkflowTemplatesList();
  const { mutate: startWorkflow, isPending } = useStartWorkflow();

  const templateOptions = (templatesData?.data ?? [])
    .filter((t) => t.isActive)
    .map((t) => ({ value: t.id, label: t.name }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!templateId) {
      toast.error("Choose a workflow template.");
      return;
    }
    startWorkflow(
      { fileId, templateId, remarks: remarks || undefined },
      {
        onSuccess: () => toast.success("Workflow started -- the file is now queued for review."),
        onError: (error) => toast.error(error?.response?.data?.message || "Unable to start workflow."),
      },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primaryBlueLight text-primaryBlue">
          <Workflow size={20} />
        </span>
        <div>
          <h3 className="font-semibold text-gray-900">Start Workflow</h3>
          <p className="text-sm text-gray-500 mt-0.5">
            This file hasn't entered a workflow yet. Pick a template to route it into review -- it's queued to the
            file's own department; no specific person needs to be named.
          </p>
        </div>
      </div>

      <BaseInput
        as="select"
        label="Workflow Template"
        name="templateId"
        required
        value={templateId}
        onChange={(_, value) => setTemplateId(value)}
        placeholder={templatesLoading ? "Loading templates..." : "Select a template"}
        options={templateOptions}
        disabled={templatesLoading}
      />

      <BaseInput
        as="textarea"
        rows={3}
        label="Remarks"
        name="remarks"
        value={remarks}
        onChange={(_, value) => setRemarks(value)}
        placeholder="Optional instructions for the first reviewer..."
      />

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-1.5 rounded-xl bg-primaryBlue px-5 py-2.5 text-sm font-semibold text-white hover:bg-primaryBlueDark transition-colors disabled:opacity-60"
        >
          {isPending ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
          Start Workflow
        </button>
      </div>
    </form>
  );
};

const TakeActionPanel = ({ fileId, instance }) => {
  const [action, setAction] = useState("");
  const [toUserId, setToUserId] = useState("");
  const [remarks, setRemarks] = useState("");
  const { mutate: transition, isPending } = useWorkflowTransition();

  const availableActions = getAvailableActions(instance);
  const needsTarget = action && actionNeedsTarget(action, instance.currentStep);

  const { data: eligibleData, isLoading: isLoadingTargets } = useEligibleWorkflowTargets(fileId, needsTarget ? action : undefined);
  const isConstrained = Boolean(eligibleData?.constrained);
  const userOptions = (eligibleData?.users ?? []).map((u) => ({
    value: u.id,
    label: `${u.fullName} — ${u.department?.name ?? "No Department"}`,
  }));

  const handleActionChange = (value) => {
    setAction(value);
    setToUserId("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!action) {
      toast.error("Choose an action.");
      return;
    }
    if (needsTarget && !toUserId.trim()) {
      toast.error("This action needs a target user.");
      return;
    }

    transition(
      { fileId, action, toUserId: needsTarget ? toUserId.trim() : undefined, remarks: remarks || undefined },
      {
        onSuccess: () => {
          toast.success(`${ACTION_LABELS[action]} completed successfully.`);
          setAction("");
          setToUserId("");
          setRemarks("");
        },
        onError: (error) => toast.error(error?.response?.data?.message || `Unable to ${ACTION_LABELS[action]?.toLowerCase()}.`),
      },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-primaryBlue/15 bg-primaryBlueLight/40 p-5 space-y-4">
      <h3 className="font-semibold text-gray-900">Take Action</h3>

      <BaseInput
        as="select"
        label="Action"
        name="action"
        required
        value={action}
        onChange={(_, value) => handleActionChange(value)}
        placeholder="Select an action"
        options={availableActions.map((a) => ({ value: a, label: ACTION_LABELS[a] }))}
      />

      {needsTarget && isLoadingTargets && (
        <BaseInput as="select" label="User" name="toUserId" value="" onChange={() => {}} placeholder="Loading eligible users..." options={[]} disabled />
      )}

      {needsTarget && !isLoadingTargets && isConstrained && (
        <BaseInput
          as="select"
          label="User"
          name="toUserId"
          required
          value={toUserId}
          onChange={(_, value) => setToUserId(value)}
          placeholder={userOptions.length ? "Select a user" : "No eligible users found"}
          options={userOptions}
          disabled={!userOptions.length}
          helperText={userOptions.length ? undefined : "Nobody currently holds the role this step requires."}
        />
      )}

      {needsTarget && !isLoadingTargets && !isConstrained && (
        <BaseInput
          label="User"
          name="toUserId"
          required
          value={toUserId}
          onChange={(_, value) => setToUserId(value)}
          placeholder="User ID to route this to"
          helperText="This action isn't limited to a specific role -- enter the exact user ID."
        />
      )}

      <BaseInput
        as="textarea"
        rows={3}
        label="Remarks"
        name="remarks"
        value={remarks}
        onChange={(_, value) => setRemarks(value)}
        placeholder="On a decision action, this is also saved as a formal minute..."
      />

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending || !action}
          className="inline-flex items-center gap-1.5 rounded-xl bg-primaryBlue px-5 py-2.5 text-sm font-semibold text-white hover:bg-primaryBlueDark transition-colors disabled:opacity-60"
        >
          {isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          Submit
        </button>
      </div>
    </form>
  );
};

const FileWorkflowTab = ({ fileId }) => {
  const user = useAuthStore((state) => state.user);
  const { data: status, isLoading, isError, refetch } = useFileWorkflowStatus(fileId);
  const { data: movementsData } = useFileMovements(fileId);
  const { mutate: claim, isPending: isClaiming } = useClaimWorkflowAssignment();

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-40 rounded-2xl bg-gray-100" />
        <div className="h-32 rounded-2xl bg-gray-100" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center">
        <p className="text-sm text-red-600">Unable to load workflow status.</p>
        <button type="button" onClick={() => refetch()} className="mt-1.5 text-sm font-semibold text-red-700 hover:underline">
          Try again
        </button>
      </div>
    );
  }

  const { instance, currentAssignment } = status;
  const isCurrentHolder = currentAssignment?.assignedTo?.id === user?.id;
  const isUnclaimed = instance && !currentAssignment?.assignedTo;
  const isOverdue = currentAssignment?.dueDate && new Date(currentAssignment.dueDate) < new Date() && instance?.state === "IN_PROGRESS";
  const movements = movementsData?.data ?? [];

  const handleClaim = () => {
    claim(
      { fileId },
      {
        onSuccess: () => toast.success("Assignment claimed."),
        onError: (error) => toast.error(error?.response?.data?.message || "Unable to claim this assignment."),
      },
    );
  };

  return (
    <div className="space-y-4">
      {!instance ? (
        <StartWorkflowPanel fileId={fileId} />
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-semibold text-gray-900">Workflow Status</h3>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATE_BADGES[instance.state] ?? "bg-gray-100 text-gray-700"}`}>
                  {instance.state.replace("_", " ")}
                </span>
              </div>
              <div className="divide-y divide-gray-50">
                <InfoRow icon={Workflow} label="Template" value={instance.template?.name} />
                <InfoRow
                  icon={CalendarClock}
                  label="Current Step"
                  value={instance.currentStep ? `${instance.currentStep.name}${instance.currentStep.isFinalStep ? " (Final)" : ""}` : "—"}
                />
                <InfoRow icon={CalendarClock} label="Started" value={formatDateTime(instance.startedAt)} />
                {instance.completedAt && <InfoRow icon={CalendarClock} label="Completed" value={formatDateTime(instance.completedAt)} />}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Current Assignment</h3>
              <div className="divide-y divide-gray-50">
                <InfoRow
                  icon={User}
                  label="Held By"
                  value={currentAssignment?.assignedTo?.fullName ?? "Unclaimed"}
                  valueClassName={currentAssignment?.assignedTo ? "text-gray-900" : "text-amber-600"}
                />
                <InfoRow icon={Building2} label="Department" value={currentAssignment?.assignedDepartment?.name} />
                <InfoRow icon={User} label="Assigned By" value={currentAssignment?.assignedBy?.fullName} />
                <InfoRow
                  icon={CalendarClock}
                  label="Due"
                  value={formatDateTime(currentAssignment?.dueDate)}
                  valueClassName={isOverdue ? "text-red-600" : "text-gray-900"}
                />
              </div>
              {isUnclaimed && instance.state === "IN_PROGRESS" && (
                <button
                  type="button"
                  onClick={handleClaim}
                  disabled={isClaiming}
                  className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-primaryBlue/30 bg-primaryBlueLight px-4 py-2.5 text-sm font-semibold text-primaryBlue hover:bg-primaryBlue/15 transition-colors disabled:opacity-60"
                >
                  {isClaiming ? <Loader2 size={15} className="animate-spin" /> : <Hand size={15} />}
                  Claim This Assignment
                </button>
              )}
            </div>
          </div>

          {isCurrentHolder && ["IN_PROGRESS", "ON_HOLD"].includes(instance.state) && (
            <TakeActionPanel fileId={fileId} instance={instance} />
          )}

          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <History size={15} className="text-gray-400" />
              Movement History
            </h3>
            {movements.length ? (
              <div className="divide-y divide-gray-50">
                {movements.map((m) => (
                  <div key={m.id} className="py-2.5 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium text-gray-800">
                        {m.fromUser?.fullName ?? m.fromDepartment?.name ?? "—"} → {m.toUser?.fullName ?? m.toDepartment?.name ?? "Unclaimed"}
                      </span>
                      <span className="text-xs text-gray-400 shrink-0">{formatDateTime(m.dispatchedAt)}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {m.action} {m.remarks && `-- ${m.remarks}`}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">No movements recorded yet.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default FileWorkflowTab;
