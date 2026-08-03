import { useQuery } from "@tanstack/react-query";
import { getWorkflowTemplates } from "../utils/apiServices";
import useAuthStore from "../store/authStore";
import { STALE_TIME } from "../utils/queryConfig";

/** For the "Start Workflow" template picker -- active templates only, a generous limit since it's a dropdown, not a paginated table. */
export const useWorkflowTemplatesList = (params = { limit: 100 }) => {
  const accessToken = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: ["workflow-templates-list", params],
    queryFn: async () => {
      const { data } = await getWorkflowTemplates(accessToken, params);
      return data;
    },
    enabled: Boolean(accessToken),
    staleTime: STALE_TIME.LONG,
  });
};
