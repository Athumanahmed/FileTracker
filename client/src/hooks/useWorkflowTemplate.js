import { useQuery } from "@tanstack/react-query";
import { getWorkflowTemplateById } from "../utils/apiServices";
import useAuthStore from "../store/authStore";
import { STALE_TIME } from "../utils/queryConfig";

/** A single workflow template with its ordered `steps[]` -- powers the template detail/step-config page. */
export const useWorkflowTemplate = (templateId) => {
  const accessToken = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: ["admin-workflow-template", templateId],
    queryFn: async () => {
      const { data } = await getWorkflowTemplateById(accessToken, templateId);
      return data.data;
    },
    enabled: Boolean(accessToken) && Boolean(templateId),
    staleTime: STALE_TIME.SHORT,
  });
};
