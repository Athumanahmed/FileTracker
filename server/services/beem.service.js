import axios from "axios";
import { beemConfig } from "../config/beem.js";
import { AppError } from "../utils/AppError.js";

const AUTH_HEADER = `Basic ${Buffer.from(`${beemConfig.apiKey}:${beemConfig.secretKey}`).toString("base64")}`;

/**
 * Thin wrapper around the Beem Africa SMS API. Single responsibility:
 * format one OTP message and send it -- no eligibility checks, no OTP
 * generation/hashing/storage, no rate limiting. All of that is the
 * caller's business logic, not this service's.
 */
export class BeemSmsService {
  async sendOtp(phoneNumber, otp) {
    const message = `Your EFTMS password reset code is ${otp}. It expires in 5 minutes. Do not share this code with anyone.`;

    try {
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
    } catch {
      // Never log the OTP, the message body, or the raw Beem error -- the
      // caller decides whether/how this surfaces (see forgotPassword.service.js).
      throw new AppError(502, "Failed to send OTP. Please try again later.");
    }
  }
}

export const beemSmsService = new BeemSmsService();
