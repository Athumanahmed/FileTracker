import axios from "axios";
import { beemConfig } from "../config/beem.js";
import { AppError } from "../utils/AppError.js";

const AUTH_HEADER = `Basic ${Buffer.from(`${beemConfig.apiKey}:${beemConfig.secretKey}`).toString("base64")}`;

/**
 * Thin wrapper around the Beem Africa SMS API. Single responsibility:
 * send one message to one number -- no eligibility checks, no OTP/queue
 * generation or storage, no rate limiting. All of that is the caller's
 * business logic, not this service's. `sms.service.js` is the
 * provider-agnostic entry point every other module should import instead
 * of this file directly (see storage.repository.js for the same pattern).
 */
export class BeemSmsService {
  /** Generic send -- the Notification module's transport for the SMS channel (Phase 8). Any caller's message text, no OTP-specific framing. */
  async send(phoneNumber, message) {
    const { data } = await axios.post(
      beemConfig.apiUrl,
      {
        source_addr: beemConfig.senderId,
        encoding: 0,
        message,
        recipients: [{ recipient_id: 1, dest_addr: phoneNumber }],
      },
      {
        headers: {
          Authorization: AUTH_HEADER,
          "Content-Type": "application/json",
        },
        timeout: 10_000,
      },
    );

    if (!data?.successful) {
      throw new Error("Beem API reported an unsuccessful send");
    }
  }

  async sendOtp(phoneNumber, otp) {
    const message = `Your EFTMS password reset code is ${otp}. It expires in 5 minutes. Do not share this code with anyone.`;

    try {
      await this.send(phoneNumber, message);
    } catch {
      // Never log the OTP, the message body, or the raw Beem error -- the
      // caller decides whether/how this surfaces (see forgotPassword.service.js).
      throw new AppError(502, "Failed to send OTP. Please try again later.");
    }
  }
}

export const beemSmsService = new BeemSmsService();
