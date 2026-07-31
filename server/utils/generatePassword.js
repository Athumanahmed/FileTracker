import crypto from "crypto";

// Ambiguous-looking characters (O/0, I/1/l) excluded so an admin reading
// the generated password aloud/off a screen can't mis-transcribe it.
const UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const LOWER = "abcdefghijkmnopqrstuvwxyz";
const DIGITS = "23456789";
const SPECIAL = "!@#$%^&*";
const ALL = UPPER + LOWER + DIGITS + SPECIAL;

const pickChar = (charset) => charset[crypto.randomInt(0, charset.length)];

/**
 * Generates a random default password for admin-created accounts.
 * Guarantees at least one uppercase, lowercase, digit, and special
 * character so it always satisfies PASSWORD_COMPLEXITY_REGEX -- never
 * client-supplied, always paired with mustChangePassword: true.
 */
export const generateDefaultPassword = (length = 12) => {
  const required = [pickChar(UPPER), pickChar(LOWER), pickChar(DIGITS), pickChar(SPECIAL)];
  const rest = Array.from({ length: Math.max(length - required.length, 0) }, () => pickChar(ALL));

  const chars = [...required, ...rest];
  for (let i = chars.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join("");
};
