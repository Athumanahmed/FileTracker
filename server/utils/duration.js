const UNIT_TO_MS = {
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
};

/**
 * Parses short duration strings ("15m", "7d", "30s") into milliseconds.
 * Used anywhere a config value needs to become a TTL, cookie maxAge, or lock expiry.
 */
export const parseDurationToMs = (input) => {
  const match = /^(\d+)\s*(s|m|h|d)$/i.exec(String(input).trim());

  if (!match) {
    throw new Error(
      `Invalid duration format: "${input}". Expected a number followed by s, m, h, or d (e.g. "15m", "7d").`,
    );
  }

  const [, amount, unit] = match;
  return Number(amount) * UNIT_TO_MS[unit.toLowerCase()];
};
