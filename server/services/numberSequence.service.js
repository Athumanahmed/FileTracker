import * as numberSequenceRepository from "../repositories/numberSequence.repository.js";

const ORG_PREFIX = "TMC";

const pad = (num, length) => String(num).padStart(length, "0");

/**
 * Returns the next value in a named, year-scoped counter (e.g.
 * "FILE_NUMBER:FIN" for 2026). Each distinct scope+year pair is its own
 * independent, gap-free sequence.
 */
const nextValue = async (scope, year) => {
  const record = await numberSequenceRepository.incrementAndGet(scope, year);
  return record.lastValue;
};

/** `TMC/{DEPT_CODE}/{YEAR}/{00001}` -- numbered per department, per year. */
export const generateFileNumber = async (departmentCode, year) => {
  const seq = await nextValue(`FILE_NUMBER:${departmentCode}`, year);
  return `${ORG_PREFIX}/${departmentCode}/${year}/${pad(seq, 5)}`;
};

/** `TMC/REG/{YEAR}/{000001}` -- council-wide registry log entry, independent of department/category. */
export const generateRegistryNumber = async (year) => {
  const seq = await nextValue("REGISTRY_NUMBER", year);
  return `${ORG_PREFIX}/REG/${year}/${pad(seq, 6)}`;
};

/** `TMC/TRK/{YEAR}/{000001}` -- the citizen-facing tracking code. */
export const generateTrackingNumber = async (year) => {
  const seq = await nextValue("TRACKING_NUMBER", year);
  return `${ORG_PREFIX}/TRK/${year}/${pad(seq, 6)}`;
};

/** `TMC/CTZ/{YEAR}/{000001}` -- assigned once per unique citizen, not per file. */
export const generateCitizenNumber = async (year) => {
  const seq = await nextValue("CITIZEN_NUMBER", year);
  return `${ORG_PREFIX}/CTZ/${year}/${pad(seq, 6)}`;
};
