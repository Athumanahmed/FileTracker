import { subscribe } from "../utils/eventBus.js";
import { normalizePhoneTZ } from "../utils/normalizePhone.js";
import * as fileRepository from "../repositories/file.repository.js";
import * as citizenSmsMessageRepository from "../repositories/citizenSmsMessage.repository.js";
import { buildCitizenSms } from "./citizenSmsTemplates.js";

/**
 * Turns a small allowlist of domain events into a queued citizen SMS --
 * but only for files linked to a Citizen who has a phone number and hasn't
 * been opted out. Read-only against the file; the actual send is the
 * cron-driven queue's job (citizenSmsQueue.service.js).
 *
 * Deliberately narrow: internal routing (FORWARD/RETURN/REASSIGN/HOLD/
 * RESUME) never texts a citizen -- only registration and the outcomes that
 * actually change what the citizen should do next.
 */
const EVENT_KEY_BY_TYPE = {
  FILE_REGISTERED: "REGISTERED",
  FILE_INFORMATION_REQUESTED: "INFO_REQUESTED",
  FILE_APPROVED: "APPROVED",
  FILE_REJECTED: "REJECTED",
  FILE_COMPLETED: "COMPLETED",
  FILE_CLOSED: "CLOSED",
};

// APPROVE/REJECT/COMPLETE/CLOSE all emit their event even at a non-final
// step (an "approve & forward" still publishes FILE_APPROVED). Only tell
// the citizen "approved/completed/closed" once the file's status actually
// says so.
const TERMINAL_ONLY_KEYS = new Set(["APPROVED", "REJECTED", "COMPLETED", "CLOSED"]);
const TERMINAL_STATUSES = new Set(["COMPLETED", "REJECTED", "CLOSED"]);

const handleEvent = async (event) => {
  const eventKey = EVENT_KEY_BY_TYPE[event.type];
  if (!eventKey || !event.fileId) return;

  const file = await fileRepository.findForCitizenNotification(event.fileId);
  if (!file || !file.citizenId || !file.citizen) return;

  const { citizen } = file;
  if (!citizen.isActive || !citizen.smsNotificationsEnabled || !citizen.phoneNumber) return;

  if (TERMINAL_ONLY_KEYS.has(eventKey) && !TERMINAL_STATUSES.has(file.status)) return;

  if (await citizenSmsMessageRepository.existsForFileEvent(file.id, eventKey)) return;

  const message = buildCitizenSms(eventKey, { trackingNumber: file.trackingNumber, title: file.title });

  try {
    await citizenSmsMessageRepository.enqueue({
      citizenId: citizen.id,
      fileId: file.id,
      eventKey,
      phoneNumber: normalizePhoneTZ(citizen.phoneNumber),
      message,
    });
  } catch (err) {
    // Unique [fileId, eventKey] race -- another handler enqueued it first. Fine.
    if (err?.code !== "P2002") throw err;
  }
};

export const registerCitizenSmsSubscriber = () => {
  subscribe(handleEvent);
};
