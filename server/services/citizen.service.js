import { AppError } from "../utils/AppError.js";
import { AUDIT_ACTIONS } from "../utils/auditActions.js";
import * as citizenRepository from "../repositories/citizen.repository.js";
import * as authRepository from "../repositories/auth.repository.js";
import * as numberSequenceService from "./numberSequence.service.js";

/**
 * Resolves the citizen a file is being registered for:
 *  - citizenId given            -> must already exist
 *  - citizen{} given, no id     -> reuse an existing match by nationalId
 *                                   (most authoritative) or phoneNumber,
 *                                   otherwise create a new record
 *  - neither given               -> null (internal file, no external party)
 * Never creates a duplicate Citizen for the same national ID/phone --
 * every file from the same person links to one canonical Citizen row.
 */
export const findOrCreateCitizen = async ({ citizenId, citizenPayload, actorId }) => {
  if (citizenId) {
    const citizen = await citizenRepository.findById(citizenId);
    if (!citizen) throw new AppError(404, "Citizen not found");
    return citizen;
  }

  if (!citizenPayload) return null;

  if (citizenPayload.nationalId) {
    const existing = await citizenRepository.findByNationalId(citizenPayload.nationalId);
    if (existing) return existing;
  } else if (citizenPayload.phoneNumber) {
    const existing = await citizenRepository.findByPhoneNumber(citizenPayload.phoneNumber);
    if (existing) return existing;
  }

  const year = new Date().getFullYear();
  const citizenNumber = await numberSequenceService.generateCitizenNumber(year);

  return citizenRepository.create({
    citizenNumber,
    firstName: citizenPayload.firstName,
    middleName: citizenPayload.middleName || null,
    lastName: citizenPayload.lastName,
    fullName: [citizenPayload.firstName, citizenPayload.middleName, citizenPayload.lastName]
      .filter(Boolean)
      .join(" "),
    nationalId: citizenPayload.nationalId || null,
    phoneNumber: citizenPayload.phoneNumber || null,
    // Opt-in by default; registry can pass false to suppress the citizen SMS alerts.
    smsNotificationsEnabled: citizenPayload.smsNotificationsEnabled !== false,
    alternatePhoneNumber: citizenPayload.alternatePhoneNumber || null,
    email: citizenPayload.email || null,
    physicalAddress: citizenPayload.physicalAddress || null,
    postalAddress: citizenPayload.postalAddress || null,
    ward: citizenPayload.ward || null,
    village: citizenPayload.village || null,
    district: citizenPayload.district || null,
    region: citizenPayload.region || null,
    organizationName: citizenPayload.organizationName || null,
    registeredById: actorId ?? null,
  });
};

/**
 * Registry-controlled toggle for the citizen-facing SMS milestone alerts
 * (see CitizenSmsMessage / citizenSms.subscriber.js). Applies to every file
 * linked to this citizen, current and future.
 */
export const setSmsPreference = async ({ citizenId, enabled, actorId, ipAddress }) => {
  const citizen = await citizenRepository.findById(citizenId);
  if (!citizen) throw new AppError(404, "Citizen not found");

  const updated = await citizenRepository.update(citizenId, { smsNotificationsEnabled: enabled });

  await authRepository.createAuditLog({
    userId: actorId,
    action: AUDIT_ACTIONS.CITIZEN_SMS_PREFERENCE_UPDATED,
    entity: "Citizen",
    entityId: citizenId,
    description: `Citizen SMS alerts ${enabled ? "enabled" : "disabled"} (${citizenId})`,
    metadata: { smsNotificationsEnabled: enabled },
    ipAddress,
  });

  return { id: updated.id, smsNotificationsEnabled: updated.smsNotificationsEnabled };
};
