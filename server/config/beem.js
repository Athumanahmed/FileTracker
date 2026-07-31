import "dotenv/config";
import { requiredEnv } from "../utils/env.js";

export const beemConfig = {
  apiKey: requiredEnv("BEEM_AFRICA_API_KEY_SMS"),
  secretKey: requiredEnv("BEEM_AFRICA_SECRET_KEY_SMS"),
  senderId: requiredEnv("SENDER_ID"),
  apiUrl: process.env.BEEM_SMS_API_URL || "https://apisms.beem.africa/v1/send",
};
