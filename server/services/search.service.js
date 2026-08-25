import * as fileRepository from "../repositories/file.repository.js";
import * as citizenRepository from "../repositories/citizen.repository.js";
import { cached, CACHE_TTL } from "../utils/cache.js";

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 25;

/** Clamped rather than trusted as-is -- an unclamped client-supplied limit would be both an abusable cache-key multiplier and an unbounded query. */
const resolveLimit = (limit) => {
  const parsed = Number(limit);
  if (!Number.isInteger(parsed) || parsed < 1) return DEFAULT_LIMIT;
  return Math.min(parsed, MAX_LIMIT);
};

const sanitizeFile = (file) => ({
  id: file.id,
  fileNumber: file.fileNumber,
  registryNumber: file.registryNumber,
  trackingNumber: file.trackingNumber,
  title: file.title,
  status: file.status,
  priority: file.priority,
  department: file.department,
  category: file.category,
  createdAt: file.createdAt,
});

const sanitizeCitizen = (citizen) => ({
  id: citizen.id,
  citizenNumber: citizen.citizenNumber,
  fullName: citizen.fullName,
  phoneNumber: citizen.phoneNumber,
  nationalId: citizen.nationalId,
});

// Files are not department-scoped for anyone holding FILES.READ (see
// file.service.js/authorize("FILES.READ")) -- every caller sees the same
// results for the same term, so one shared cache key per term+limit is
// correct and far more cache-efficient than keying by actor.
export const globalSearch = (term, { limit } = {}) => {
  const resolvedLimit = resolveLimit(limit);
  const normalizedTerm = term.trim().toLowerCase();

  return cached(`search:global:${resolvedLimit}:${normalizedTerm}`, CACHE_TTL.SHORT, async () => {
    const [files, citizens] = await Promise.all([
      fileRepository.searchTop(normalizedTerm, resolvedLimit),
      citizenRepository.search(normalizedTerm, resolvedLimit),
    ]);
    return {
      files: files.map(sanitizeFile),
      citizens: citizens.map(sanitizeCitizen),
    };
  });
};
