/**
 * Fails fast on boot if a required environment variable is missing,
 * instead of letting `undefined` silently flow into a secret/config value.
 */
export const requiredEnv = (name) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};
