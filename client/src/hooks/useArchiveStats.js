import { useQuery } from "@tanstack/react-query";
import { getArchiveStats } from "../utils/apiServices";
import useAuthStore from "../store/authStore";
import { STALE_TIME } from "../utils/queryConfig";

/**
 * { readyToArchive: { COMPLETED, REJECTED, CLOSED, total }, archived, restored,
 *   expiredRetention, withinRetention, noRetentionSet,
 *   archivedByMonth: [{ period, count }], retentionRunway: [{ key, label, count }],
 *   upcomingExpiries: [{ fileId, fileNumber, title, retentionExpiresAt, overdue }] }
 */
export const useArchiveStats = () => {
  const accessToken = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: ["archive-stats"],
    queryFn: async () => {
      const { data } = await getArchiveStats(accessToken);
      return data.data;
    },
    enabled: Boolean(accessToken),
    staleTime: STALE_TIME.SHORT,
  });
};
