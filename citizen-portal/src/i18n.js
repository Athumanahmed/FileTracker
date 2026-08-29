/**
 * Tiny built-in dictionary -- the portal has ~25 UI strings, not enough to
 * justify pulling in i18next. The API already returns status and milestone
 * labels in both languages, so this only covers the static chrome.
 */
export const LANGS = [
  { code: "sw", label: "Kiswahili" },
  { code: "en", label: "English" },
];

const DICT = {
  sw: {
    council: "Halmashauri ya Manispaa ya Tabora",
    portalName: "Kituo cha Ufuatiliaji wa Faili",
    heroTitle: "Fuatilia hali ya faili lako",
    heroSubtitle:
      "Ingiza namba ya ufuatiliaji uliyopewa na ofisi ya usajili pamoja na namba ya simu uliyotumia.",
    trackingNumber: "Namba ya Ufuatiliaji au Namba ya Faili",
    trackingNumberHint: "Kama ilivyo kwenye SMS, au namba yoyote ya faili (TRK, ICT au REG). Mf. TMC/TRK/2026/000123",
    phone: "Namba ya Simu",
    phoneHint: "Namba uliyotoa wakati faili lilipoandikishwa.",
    submit: "Fuatilia Faili",
    submitting: "Inatafuta...",
    required: "Sehemu hii inahitajika",
    notFound:
      "Hakuna faili linalolingana na namba ya ufuatiliaji na namba ya simu ulizoingiza. Hakikisha zote ziko sahihi.",
    genericError: "Imeshindikana kupata taarifa kwa sasa. Tafadhali jaribu tena baada ya muda.",
    rateLimited: "Umejaribu mara nyingi mfululizo. Tafadhali subiri kidogo kisha ujaribu tena.",
    resultTitle: "Hali ya Faili",
    field_tracking: "Namba ya Ufuatiliaji",
    field_department: "Idara",
    field_registered: "Tarehe ya Kuandikishwa",
    field_updated: "Ilihuishwa Mwisho",
    milestonesTitle: "Hatua za Faili",
    trackAnother: "Fuatilia faili jingine",
    greeting: "Habari",
    disclaimer:
      "Taarifa hizi ni za hali ya jumla ya faili lako. Kwa maelezo zaidi, tembelea ofisi ya usajili ya Halmashauri.",
    footer: "Halmashauri ya Manispaa ya Tabora — Mfumo wa Ufuatiliaji wa Nyaraka",
  },
  en: {
    council: "Tabora Municipal Council",
    portalName: "File Tracking Portal",
    heroTitle: "Track your file status",
    heroSubtitle:
      "Enter the tracking number given to you by the registry office and the phone number you used.",
    trackingNumber: "Tracking or File Number",
    trackingNumberHint: "As shown in your SMS, or any of the file's numbers (TRK, ICT or REG). e.g. TMC/TRK/2026/000123",
    phone: "Phone Number",
    phoneHint: "The number you gave when the file was registered.",
    submit: "Track File",
    submitting: "Searching...",
    required: "This field is required",
    notFound:
      "No file matches the tracking number and phone number you entered. Please check that both are correct.",
    genericError: "Unable to retrieve the status right now. Please try again shortly.",
    rateLimited: "Too many attempts in a row. Please wait a moment and try again.",
    resultTitle: "File Status",
    field_tracking: "Tracking Number",
    field_department: "Department",
    field_registered: "Registered On",
    field_updated: "Last Updated",
    milestonesTitle: "File Milestones",
    trackAnother: "Track another file",
    greeting: "Hello",
    disclaimer:
      "This is a general status of your file. For further details, please visit the Council registry office.",
    footer: "Tabora Municipal Council — Document Tracking System",
  },
};

export const makeT = (lang) => (key) => DICT[lang]?.[key] ?? DICT.sw[key] ?? key;
