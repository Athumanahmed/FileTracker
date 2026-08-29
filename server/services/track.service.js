import { AppError } from "../utils/AppError.js";
import { normalizePhoneTZ } from "../utils/normalizePhone.js";
import * as fileRepository from "../repositories/file.repository.js";
import * as timelineEventRepository from "../repositories/timelineEvent.repository.js";

// Deliberately generic -- "not found" and "phone doesn't match" must be
// indistinguishable so a sequential tracking number can't be walked.
const NO_MATCH = new AppError(404, "No file matches that tracking number and phone number.");

const STATUS_LABELS = {
  DRAFT: { sw: "Rasimu", en: "Draft" },
  REGISTERED: { sw: "Imesajiliwa", en: "Registered" },
  IN_PROGRESS: { sw: "Inashughulikiwa", en: "In progress" },
  PENDING_ACTION: { sw: "Inasubiri hatua", en: "Awaiting action" },
  FORWARDED: { sw: "Inashughulikiwa", en: "In progress" },
  RETURNED: { sw: "Inashughulikiwa", en: "In progress" },
  ON_HOLD: { sw: "Imesimamishwa kwa muda", en: "On hold" },
  APPROVED: { sw: "Imeidhinishwa", en: "Approved" },
  REJECTED: { sw: "Haikukubaliwa", en: "Not approved" },
  COMPLETED: { sw: "Imekamilika", en: "Completed" },
  CLOSED: { sw: "Imefungwa", en: "Closed" },
  ARCHIVED: { sw: "Imehifadhiwa", en: "Archived" },
};

// Only these timeline events are shown to the citizen, each collapsed to a
// single milestone (its first occurrence). Everything else -- reassigns,
// holds/resumes, minutes, attachments, internal notes -- stays private.
const MILESTONE_LABELS = {
  FILE_REGISTERED: { key: "registered", sw: "Faili limesajiliwa", en: "File registered" },
  FILE_FORWARDED: { key: "under_review", sw: "Faili linashughulikiwa", en: "File under review" },
  FILE_INFORMATION_REQUESTED: {
    key: "info_requested",
    sw: "Taarifa za ziada zimeombwa",
    en: "Additional information requested",
  },
  FILE_APPROVED: { key: "approved", sw: "Faili limeidhinishwa", en: "File approved" },
  FILE_REJECTED: { key: "rejected", sw: "Faili halikukubaliwa", en: "File not approved" },
  FILE_COMPLETED: { key: "completed", sw: "Shughuli zimekamilika", en: "Processing complete" },
  FILE_CLOSED: { key: "closed", sw: "Faili limefungwa", en: "File closed" },
  FILE_ARCHIVED: { key: "archived", sw: "Faili limehifadhiwa", en: "File archived" },
};

const safeNormalize = (phone) => {
  try {
    return phone ? normalizePhoneTZ(String(phone).trim()) : null;
  } catch {
    return null;
  }
};

export const getPublicTrackingView = async ({ trackingNumber, phone }) => {
  const file = await fileRepository.findByPublicReference(trackingNumber.trim());
  if (!file || !file.citizen?.phoneNumber) throw NO_MATCH;

  const onRecord = safeNormalize(file.citizen.phoneNumber);
  const provided = safeNormalize(phone);
  if (!onRecord || !provided || onRecord !== provided) throw NO_MATCH;

  const events = await timelineEventRepository.findByFileId({
    fileId: file.id,
    where: { eventType: { in: Object.keys(MILESTONE_LABELS) } },
    orderBy: { occurredAt: "asc" },
  });

  const seen = new Set();
  const milestones = [];
  for (const event of events) {
    const label = MILESTONE_LABELS[event.eventType];
    if (!label || seen.has(label.key)) continue;
    seen.add(label.key);
    milestones.push({ key: label.key, sw: label.sw, en: label.en, occurredAt: event.occurredAt });
  }

  return {
    trackingNumber: file.trackingNumber,
    title: file.title,
    citizenName: file.citizen.firstName,
    department: file.department?.name ?? null,
    status: { code: file.status, ...(STATUS_LABELS[file.status] ?? { sw: file.status, en: file.status }) },
    registeredAt: file.createdAt,
    lastUpdatedAt: file.closedAt ?? file.updatedAt,
    milestones,
  };
};
