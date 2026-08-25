import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { globalSearch } from "../utils/apiServices";
import useAuthStore from "../store/authStore";
import { STALE_TIME } from "../utils/queryConfig";

const MIN_TERM_LENGTH = 2;

/**
 * Backs the Search page's typeahead -- GET /api/v1/search, Redis-cached
 * server-side (search.service.js) so repeated/shared terms across users
 * skip the Postgres fan-out entirely. The caller debounces keystrokes
 * (useDebounce) before this ever sees a `term`; this hook just guards the
 * request itself against firing on a too-short/empty term, mirroring the
 * backend's own 2-100 char validation (search.validation.js) so a query
 * that would 400 never leaves the browser.
 */
export const useGlobalSearch = (term, { limit } = {}) => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const trimmed = term.trim();

  return useQuery({
    queryKey: ["global-search", trimmed, limit],
    queryFn: async () => {
      const { data } = await globalSearch(accessToken, { q: trimmed, ...(limit ? { limit } : {}) });
      return data.data;
    },
    enabled: Boolean(accessToken) && trimmed.length >= MIN_TERM_LENGTH,
    staleTime: STALE_TIME.SHORT,
    placeholderData: keepPreviousData,
  });
};
