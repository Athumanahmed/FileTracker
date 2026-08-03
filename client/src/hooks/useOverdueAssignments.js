import { useQuery } from "@tanstack/react-query";
import { getOverdueAssignments } from "../utils/apiServices";
import useAuthStore from "../store/authStore";
import { STALE_TIME } from "../utils/queryConfig";

/** Array of { ...assignment, file } -- every current assignment already past its SLA due date, org-wide. */
export const useOverdueAssignments = () => {
  const accessToken = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: ["overdue-assignments"],
    queryFn: async () => {
      const { data } = await getOverdueAssignments(accessToken);
      return data.data;
    },
    enabled: Boolean(accessToken),
    staleTime: STALE_TIME.SHORT,
  });
};
