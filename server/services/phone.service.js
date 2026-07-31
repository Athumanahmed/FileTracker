import { AppError } from "../utils/AppError.js";

/**
 * Tanzanian mobile subscriber numbers: 9 digits after the country/trunk
 * prefix, starting with 6 or 7 (Vodacom/Tigo/Airtel/Halotel etc.).
 */
const TZ_LOCAL_NUMBER = /^[67]\d{8}$/;

/**
 * Normalizes any of the supported Tanzanian phone formats --
 * 0712345678 / 255712345678 / +255712345678 -- to the canonical
 * "255712345678" form used everywhere phone numbers are stored or
 * compared (matches User.phoneNumber). Throws on anything else so
 * every caller gets the same validation for free.
 */
export const normalizePhoneNumber = (rawPhoneNumber) => {
  const cleaned = String(rawPhoneNumber ?? "")
    .trim()
    .replace(/[\s-]/g, "");

  let localNumber;

  if (cleaned.startsWith("+255")) {
    localNumber = cleaned.slice(4);
  } else if (cleaned.startsWith("255")) {
    localNumber = cleaned.slice(3);
  } else if (cleaned.startsWith("0")) {
    localNumber = cleaned.slice(1);
  } else {
    throw new AppError(422, "Invalid phone number format.");
  }

  if (!TZ_LOCAL_NUMBER.test(localNumber)) {
    throw new AppError(422, "Invalid phone number format.");
  }

  return `255${localNumber}`;
};
