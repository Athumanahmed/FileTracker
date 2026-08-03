import { beemSmsService } from "./beem.service.js";

/**
 * Provider-agnostic SMS entry point -- every caller (NotificationQueue's
 * dispatcher, forgotPassword's OTP flow) goes through this, never
 * `beem.service.js` directly. Swapping providers later (Africa's Talking,
 * Twilio, ...) means rewriting only this file's internals, the same
 * abstraction shape the Storage Module uses for its provider.
 */
export const sendSms = (phoneNumber, message) => beemSmsService.send(phoneNumber, message);
