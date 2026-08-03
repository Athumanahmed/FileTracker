import {
  FilePlus2,
  UserCheck,
  Send,
  Undo2,
  CheckCircle2,
  XCircle,
  PauseCircle,
  PlayCircle,
  FileCheck2,
  FileX2,
  Archive,
  ArchiveRestore,
  HelpCircle,
  FileSignature,
  MessageSquare,
  Paperclip,
  RefreshCw,
  Trash2,
  Clock,
  AlarmClockOff,
  Megaphone,
} from "lucide-react";

// Mirrors server/prisma/schema.prisma's NotificationType enum exactly.
export const NOTIFICATION_TYPE_META = {
  FILE_REGISTERED: { label: "File Registered", icon: FilePlus2, tone: "blue" },
  FILE_ASSIGNED: { label: "File Assigned", icon: UserCheck, tone: "blue" },
  FILE_FORWARDED: { label: "File Forwarded", icon: Send, tone: "indigo" },
  FILE_RETURNED: { label: "File Returned", icon: Undo2, tone: "cyan" },
  FILE_APPROVED: { label: "File Approved", icon: CheckCircle2, tone: "green" },
  FILE_REJECTED: { label: "File Rejected", icon: XCircle, tone: "red" },
  FILE_ON_HOLD: { label: "File On Hold", icon: PauseCircle, tone: "amber" },
  FILE_RESUMED: { label: "File Resumed", icon: PlayCircle, tone: "blue" },
  FILE_COMPLETED: { label: "File Completed", icon: FileCheck2, tone: "green" },
  FILE_CLOSED: { label: "File Closed", icon: FileX2, tone: "gray" },
  FILE_ARCHIVED: { label: "File Archived", icon: Archive, tone: "purple" },
  FILE_RESTORED: { label: "File Restored", icon: ArchiveRestore, tone: "purple" },
  FILE_INFORMATION_REQUESTED: { label: "Information Requested", icon: HelpCircle, tone: "amber" },
  MINUTE_ADDED: { label: "Minute Recorded", icon: FileSignature, tone: "indigo" },
  COMMENT_ADDED: { label: "New Comment", icon: MessageSquare, tone: "blue" },
  ATTACHMENT_UPLOADED: { label: "Attachment Uploaded", icon: Paperclip, tone: "blue" },
  ATTACHMENT_REPLACED: { label: "Attachment Replaced", icon: RefreshCw, tone: "cyan" },
  ATTACHMENT_DELETED: { label: "Attachment Deleted", icon: Trash2, tone: "red" },
  DEADLINE_APPROACHING: { label: "Deadline Approaching", icon: Clock, tone: "amber" },
  DEADLINE_OVERDUE: { label: "Deadline Overdue", icon: AlarmClockOff, tone: "red" },
  SYSTEM_ALERT: { label: "System Alert", icon: Megaphone, tone: "gray" },
};

const TONE_CLASSES = {
  blue: "bg-blue-50 text-blue-600",
  indigo: "bg-indigo-50 text-indigo-600",
  cyan: "bg-cyan-50 text-cyan-600",
  green: "bg-green-50 text-green-600",
  red: "bg-red-50 text-red-600",
  amber: "bg-amber-50 text-amber-600",
  purple: "bg-purple-50 text-purple-600",
  gray: "bg-gray-100 text-gray-600",
};

export const getNotificationMeta = (type) => {
  const meta = NOTIFICATION_TYPE_META[type] || { label: type, icon: Megaphone, tone: "gray" };
  return { ...meta, toneClass: TONE_CLASSES[meta.tone] };
};

/** Only the types the preferences endpoint actually accepts (server/validators/notification.validation.js omits FILE_RESTORED). */
export const PREFERENCE_ELIGIBLE_TYPES = Object.keys(NOTIFICATION_TYPE_META).filter((type) => type !== "FILE_RESTORED");
