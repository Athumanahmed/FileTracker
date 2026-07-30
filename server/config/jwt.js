import "dotenv/config";

/**
 * Fails fast on boot if a required secret is missing, instead of issuing
 * tokens signed with `undefined`.
 */
const required = (name) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

export const jwtConfig = {
  accessSecret: required("JWT_SECRET"),
  refreshSecret: required("JWT_REFRESH_SECRET"),
  accessExpiresIn: process.env.JWT_ACCESS_EXPIRES || "15m",
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES || "7d",
  issuer: process.env.JWT_ISSUER || "eftms-tabora-mc",
  audience: process.env.JWT_AUDIENCE || "eftms-clients",
};
