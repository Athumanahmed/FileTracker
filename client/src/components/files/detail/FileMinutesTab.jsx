import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { FileSignature, Reply, Trash2, Paperclip, Send, Plus, X, Loader2, Lock } from "lucide-react";
import BaseInput from "../../shared/BaseInput";
import EmptyState from "../../shared/EmptyState";
import { formatDateTime, formatFileSize } from "../../../utils/formatters";
import { ROLES } from "../../../utils/roles";
import useAuthStore from "../../../store/authStore";
import { useFileMinutes } from "../../../hooks/useFileMinutes";
import { useFileWorkflowStatus } from "../../../hooks/useFileWorkflowStatus";
import { useCreateMinute } from "../../../hooks/useCreateMinute";
import { useReplyToMinute } from "../../../hooks/useReplyToMinute";
import { useDeleteMinute } from "../../../hooks/useDeleteMinute";

const MINUTE_TYPE_OPTIONS = [
  { value: "INSTRUCTION", label: "Instruction" },
  { value: "RECOMMENDATION", label: "Recommendation" },
  { value: "APPROVAL", label: "Approval" },
  { value: "REJECTION", label: "Rejection" },
  { value: "NOTE", label: "Note" },
  { value: "DECISION", label: "Decision" },
];

const MINUTE_TYPE_BADGES = {
  INSTRUCTION: "bg-blue-50 text-blue-700",
  RECOMMENDATION: "bg-indigo-50 text-indigo-700",
  APPROVAL: "bg-green-50 text-green-700",
  REJECTION: "bg-red-50 text-red-700",
  NOTE: "bg-gray-100 text-gray-700",
  DECISION: "bg-purple-50 text-purple-700",
};

const AddMinuteForm = ({ fileId, onDone }) => {
  const [content, setContent] = useState("");
  const [minuteType, setMinuteType] = useState("INSTRUCTION");
  const [files, setFiles] = useState([]);
  const { mutate: createMinute, isPending } = useCreateMinute();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!content.trim()) {
      toast.error("Minute content is required.");
      return;
    }
    const formData = new FormData();
    formData.append("content", content.trim());
    formData.append("minuteType", minuteType);
    files.forEach((file) => formData.append("attachments", file));

    createMinute(
      { fileId, formData },
      {
        onSuccess: () => {
          toast.success("Minute recorded successfully.");
          onDone();
        },
        onError: (error) => toast.error(error?.response?.data?.message || "Unable to record minute."),
      },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Write a Minute</h3>
        <button type="button" onClick={onDone} className="text-gray-400 hover:text-gray-600">
          <X size={16} />
        </button>
      </div>

      <BaseInput
        as="textarea"
        rows={4}
        label="Content"
        name="content"
        required
        value={content}
        onChange={(_, value) => setContent(value)}
        placeholder="Record an instruction, recommendation, approval or note..."
        helperText={`${content.length}/5000 characters`}
      />

      <BaseInput
        as="select"
        label="Minute Type"
        name="minuteType"
        value={minuteType}
        onChange={(_, value) => setMinuteType(value)}
        options={MINUTE_TYPE_OPTIONS}
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Attachments (optional)</label>
        <input
          type="file"
          multiple
          onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
          className="w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-primaryBlueLight file:px-3.5 file:py-2 file:text-sm file:font-medium file:text-primaryBlue hover:file:bg-primaryBlue/15"
        />
      </div>

      <div className="flex justify-end gap-3 pt-1">
        <button
          type="button"
          onClick={onDone}
          disabled={isPending}
          className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-1.5 rounded-xl bg-primaryBlue px-4 py-2.5 text-sm font-semibold text-white hover:bg-primaryBlueDark transition-colors disabled:opacity-60"
        >
          {isPending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
          Record Minute
        </button>
      </div>
    </form>
  );
};

const ReplyForm = ({ minuteId, fileId, onDone }) => {
  const [content, setContent] = useState("");
  const { mutate: reply, isPending } = useReplyToMinute();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    const formData = new FormData();
    formData.append("content", content.trim());

    reply(
      { minuteId, fileId, formData },
      {
        onSuccess: () => {
          toast.success("Reply recorded.");
          onDone();
        },
        onError: (error) => toast.error(error?.response?.data?.message || "Unable to reply."),
      },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-start gap-2 mt-2">
      <input
        type="text"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write a reply..."
        autoFocus
        className="flex-1 rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primaryBlue/15 focus:border-primaryBlue"
      />
      <button
        type="submit"
        disabled={isPending}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primaryBlue text-white hover:bg-primaryBlueDark transition-colors disabled:opacity-60"
      >
        {isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
      </button>
    </form>
  );
};

const MinuteCard = ({ minute, replies, fileId, canReply = false, isReply = false }) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const { mutate: deleteMinute } = useDeleteMinute();
  const user = useAuthStore((state) => state.user);
  // Server allows the author OR a SYSTEM_ADMIN to retract a minute
  // (see fileMinute.service.js#deleteMinute) -- mirror both here.
  const isAdmin = Boolean(user?.roles?.some((r) => r.code === ROLES.SYSTEM_ADMIN));
  const canDelete = user?.id === minute.writtenBy?.id || isAdmin;

  const handleDelete = () => {
    if (!window.confirm("Delete this minute? This can't be undone.")) return;
    deleteMinute(
      { minuteId: minute.id, fileId },
      {
        onSuccess: () => toast.success("Minute deleted."),
        onError: (error) => toast.error(error?.response?.data?.message || "Unable to delete minute."),
      },
    );
  };

  return (
    <div className={isReply ? "pl-6 border-l-2 border-gray-100" : ""}>
      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${MINUTE_TYPE_BADGES[minute.minuteType] ?? "bg-gray-100 text-gray-700"}`}>
              {minute.minuteType}
            </span>
            <span className="text-xs text-gray-400">
              {minute.writtenBy?.fullName} &middot; {formatDateTime(minute.createdAt)}
            </span>
          </div>
          {canDelete && (
            <button type="button" onClick={handleDelete} aria-label="Delete minute" className="text-gray-300 hover:text-red-500 transition-colors">
              <Trash2 size={15} />
            </button>
          )}
        </div>

        <p className="text-sm text-gray-800 mt-2 leading-relaxed whitespace-pre-wrap">{minute.content}</p>

        {minute.addressedTo && (
          <p className="text-xs text-gray-400 mt-2">Addressed to {minute.addressedTo.fullName}</p>
        )}

        {minute.attachments?.length > 0 && (
          <div className="mt-3 space-y-1.5">
            {minute.attachments.map((attachment) => (
              <div key={attachment.id} className="flex items-center gap-1.5 text-xs text-gray-500">
                <Paperclip size={12} />
                {attachment.title} &middot; {formatFileSize(attachment.currentVersion?.fileSizeBytes)}
              </div>
            ))}
          </div>
        )}

        {!isReply && (minute.repliesCount > 0 || canReply) && (
          <button
            type="button"
            onClick={() => setShowReplyForm((prev) => !prev)}
            disabled={!canReply}
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-primaryBlue hover:underline disabled:text-gray-400 disabled:no-underline disabled:cursor-default"
          >
            <Reply size={13} />
            {canReply ? "Reply" : "Replies"} {minute.repliesCount > 0 && `(${minute.repliesCount})`}
          </button>
        )}

        {showReplyForm && canReply && <ReplyForm minuteId={minute.id} fileId={fileId} onDone={() => setShowReplyForm(false)} />}
      </div>

      {replies?.length > 0 && (
        <div className="mt-2 space-y-2">
          {replies.map((reply) => (
            <MinuteCard key={reply.id} minute={reply} fileId={fileId} isReply />
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Minutes are gated on file custody, exactly like workflow actions: the
 * server's fileMinute.service.js#createMinute calls assertIsCurrentOwner,
 * so only the file's current holder (or a SYSTEM_ADMIN) can record a
 * minute or reply. This tab mirrors that -- the composer only appears for
 * someone who can actually submit it; everyone else gets the history plus
 * a note explaining who holds the file. `readOnly` (an archived file)
 * still hides everything regardless of custody.
 */
const FileMinutesTab = ({ fileId, readOnly = false }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const user = useAuthStore((state) => state.user);
  const { data: minutes, isLoading, isError, refetch } = useFileMinutes(fileId);
  // Custody drives who can minute. This can fail for a role without
  // WORKFLOW.READ (e.g. Archive Officer) -- treated the same as "not the
  // holder", which is the right outcome since such a role can't minute anyway.
  const { data: workflowStatus, isSuccess: workflowStatusLoaded } = useFileWorkflowStatus(fileId);

  const instance = workflowStatus?.instance;
  const currentAssignment = workflowStatus?.currentAssignment;
  const holder = currentAssignment?.assignedTo;
  const isAdmin = Boolean(user?.roles?.some((r) => r.code === ROLES.SYSTEM_ADMIN));
  const isCurrentHolder = Boolean(holder?.id && holder.id === user?.id);
  const canWrite = !readOnly && (isAdmin || isCurrentHolder);

  // What to tell someone who can't currently write -- depends on where the
  // file actually is in its lifecycle. Suppressed until custody is known,
  // so a slow/failed status fetch never shows a misleading message.
  const custodyHint = (() => {
    if (readOnly || canWrite || !workflowStatusLoaded) return null;
    if (holder) {
      return `This file is currently held by ${holder.fullName}. Only the current holder can record a minute.`;
    }
    if (instance) {
      const queue = currentAssignment?.assignedDepartment?.name;
      return `This file is waiting to be claimed${queue ? ` in the ${queue} queue` : ""}. Whoever claims it from the Workflow tab can then record minutes.`;
    }
    return "This file has no current holder, so no minute can be recorded on it right now.";
  })();

  // The flat list mixes top-level minutes and replies (see
  // server/repositories/fileMinute.repository.js#findByFileId) -- rebuild
  // the thread client-side via parentMinuteId rather than a second fetch.
  const { topLevel, repliesByParent } = useMemo(() => {
    const all = minutes ?? [];
    const top = all.filter((m) => !m.parentMinuteId);
    const byParent = new Map();
    all.filter((m) => m.parentMinuteId).forEach((reply) => {
      if (!byParent.has(reply.parentMinuteId)) byParent.set(reply.parentMinuteId, []);
      byParent.get(reply.parentMinuteId).push(reply);
    });
    return { topLevel: top, repliesByParent: byParent };
  }, [minutes]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">
          {topLevel.length} Minute{topLevel.length === 1 ? "" : "s"}
        </h3>
        {canWrite && !showAddForm && (
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primaryBlue px-4 py-2.5 text-sm font-semibold text-white hover:bg-primaryBlueDark transition-colors"
          >
            <Plus size={15} />
            Write Minute
          </button>
        )}
      </div>

      {custodyHint && (
        <div className="flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3.5">
          <Lock className="mt-0.5 shrink-0 text-amber-600" size={16} />
          <p className="text-xs leading-relaxed text-amber-800">{custodyHint}</p>
        </div>
      )}

      {canWrite && showAddForm && <AddMinuteForm fileId={fileId} onDone={() => setShowAddForm(false)} />}

      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-gray-100" />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center">
          <p className="text-sm text-red-600">Unable to load minutes.</p>
          <button type="button" onClick={() => refetch()} className="mt-1.5 text-sm font-semibold text-red-700 hover:underline">
            Try again
          </button>
        </div>
      ) : topLevel.length ? (
        <div className="space-y-3">
          {topLevel.map((minute) => (
            <MinuteCard
              key={minute.id}
              minute={minute}
              replies={repliesByParent.get(minute.id)}
              fileId={fileId}
              canReply={canWrite}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No minutes yet"
          message={
            canWrite
              ? "Record an instruction, recommendation or decision."
              : "No instructions or decisions have been recorded on this file."
          }
          icon={FileSignature}
        />
      )}
    </div>
  );
};

export default FileMinutesTab;
