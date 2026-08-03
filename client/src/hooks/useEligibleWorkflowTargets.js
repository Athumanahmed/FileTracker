import { useQuery } from "@tanstack/react-query";
import { getEligibleWorkflowTargets } from "../utils/apiServices";
import useAuthStore from "../store/authStore";
import { STALE_TIME } from "../utils/queryConfig";

/** { constrained, users } -- only fetches once an action is actually picked (action may be ""/undefined beforehand). */
export const useEligibleWorkflowTargets = (fileId, action) => {
  const accessToken = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: ["eligible-workflow-targets", fileId, action],
    queryFn: async () => {
      const { data } = await getEligibleWorkflowTargets(accessToken, fileId, action);
      return data.data;
    },
    enabled: Boolean(accessToken) && Boolean(fileId) && Boolean(action),
    staleTime: STALE_TIME.SHORT,
  });
};
