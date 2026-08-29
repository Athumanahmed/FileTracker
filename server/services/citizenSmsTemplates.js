import "dotenv/config";

/**
 * Swahili SMS bodies for the citizen milestone alerts. Kept to a single
 * segment where possible -- SMS costs money per segment and the audience is
 * Tanzanian citizens, so no English half. Pure functions, no I/O.
 */

const rawPortalUrl = (process.env.CITIZEN_PORTAL_URL || "").replace(/\/+$/, "");

/**
 * The link is only put in the SMS when it's a real public https:// host.
 * SMS aggregators' spam/phishing filters reject a message the moment it
 * contains `http://`, `localhost`, or a bare IP -- Beem returns a 403 with
 * an HTML body (confirmed by testing). A localhost URL is useless in a real
 * SMS anyway, so in dev / before a domain is configured the message simply
 * carries the tracking number with no link.
 */
export const trackUrl = /^https:\/\/(?!localhost\b|127\.|\d{1,3}(\.\d{1,3}){3}\b)\S+$/i.test(rawPortalUrl)
  ? rawPortalUrl
  : "";

// The first SMS carries the full "save this number" line; every later
// milestone just tags the reference number compactly (the citizen already
// has it). A link is appended only when CITIZEN_PORTAL_URL is a public
// https host (see trackUrl above).
const linkTail = trackUrl ? ` ${trackUrl}` : "";

const first = (body, trackingNumber) =>
  `EFTMS Tabora\n${body}\nNamba ya ufuatiliaji: ${trackingNumber}. Hifadhi namba hii kwa ufuatiliaji.${linkTail}`;

const update = (body, trackingNumber) => `EFTMS Tabora\n${body}\n(Kumb: ${trackingNumber})${linkTail}`;

const BUILDERS = {
  REGISTERED: ({ trackingNumber }) => first("Faili lako limepokelewa na kusajiliwa.", trackingNumber),
  INFO_REQUESTED: ({ trackingNumber }) =>
    update("Faili lako linahitaji taarifa za ziada. Tafadhali wasiliana na ofisi ya usajili.", trackingNumber),
  APPROVED: ({ trackingNumber }) => update("Ombi lako limeidhinishwa.", trackingNumber),
  REJECTED: ({ trackingNumber }) =>
    update("Ombi lako halikukubaliwa. Tembelea ofisi ya usajili kwa maelezo.", trackingNumber),
  COMPLETED: ({ trackingNumber }) => update("Shughuli za faili lako zimekamilika.", trackingNumber),
  CLOSED: ({ trackingNumber }) => update("Faili lako limefungwa.", trackingNumber),
};

export const CITIZEN_SMS_EVENT_KEYS = Object.keys(BUILDERS);

/** @param {string} eventKey  @param {{ trackingNumber: string }} ctx */
export const buildCitizenSms = (eventKey, ctx) => {
  const builder = BUILDERS[eventKey];
  if (!builder) throw new Error(`No citizen SMS template for event "${eventKey}"`);
  return builder(ctx);
};
