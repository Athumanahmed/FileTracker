import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { getWorkflowTemplates } from "../utils/apiServices";
import useAuthStore from "../store/authStore";
import { STALE_TIME } from "../utils/queryConfig";

/**
 * Server-paginated Workflow Templates directory listing -- distinct from
 * useWorkflowTemplatesList.js, which fetches a fixed active-only lookup for
 * the "Start Workflow" template picker. `params` (page, limit, search,
 * isActive, sortBy, sortOrder) maps 1:1 onto GET /api/v1/workflow-templates'
 * query params.
 */
export const useAdminWorkflowTemplatesList = (params) => {
  const accessToken = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: ["admin-workflow-templates-list", params],
    queryFn: async () => {
      const { data } = await getWorkflowTemplates(accessToken, params);
      return data;
    },
    enabled: Boolean(accessToken),
    placeholderData: keepPreviousData,
    staleTime: STALE_TIME.SHORT,
  });
};
