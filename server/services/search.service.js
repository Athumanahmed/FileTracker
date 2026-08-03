import * as fileRepository from "../repositories/file.repository.js";
import * as citizenRepository from "../repositories/citizen.repository.js";

const RESULT_LIMIT = 5;

const sanitizeFile = (file) => ({
  id: file.id,
  fileNumber: file.fileNumber,
  trackingNumber: file.trackingNumber,
  title: file.title,
  status: file.status,
});

const sanitizeCitizen = (citizen) => ({
  id: citizen.id,
  citizenNumber: citizen.citizenNumber,
  fullName: citizen.fullName,
  phoneNumber: citizen.phoneNumber,
  nationalId: citizen.nationalId,
});

/**
 * "Global Search" (Phase 9) -- a fast, cross-entity, top-N lookup for a
 * single search box (files + citizens), distinct from "Advanced Search"
 * (file.service.js#listFiles), which is a full paginated/filtered listing
 * of one entity. This never paginates -- it's a jump-to/autocomplete
 * result set, not a browsable list.
 */
export const globalSearch = async (term) => {
  const [files, citizens] = await Promise.all([
    fileRepository.searchTop(term, RESULT_LIMIT),
    citizenRepository.search(term, RESULT_LIMIT),
  ]);

  return {
    files: files.map(sanitizeFile),
    citizens: citizens.map(sanitizeCitizen),
  };
};
