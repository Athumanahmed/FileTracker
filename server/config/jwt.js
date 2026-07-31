import "dotenv/config";
import { requiredEnv } from "../utils/env.js";

export const jwtConfig = {
  accessSecret: requiredEnv("JWT_SECRET"),
  refreshSecret: requiredEnv("JWT_REFRESH_SECRET"),
  // Separate secret from access/refresh so a leaked reset-token secret
  // can't be used to forge a normal login session, and vice versa.
  resetTokenSecret: requiredEnv("JWT_RESET_TOKEN_SECRET"),
  accessExpiresIn: process.env.JWT_ACCESS_EXPIRES || "15m",
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES || "7d",
  resetTokenExpiresIn: process.env.JWT_RESET_TOKEN_EXPIRES || "10m",
  issuer: process.env.JWT_ISSUER || "eftms-tabora-mc",
  audience: process.env.JWT_AUDIENCE || "eftms-clients",
};
