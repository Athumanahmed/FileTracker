import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  addWorkflowTemplateStep,
  updateWorkflowTemplateStep,
  deactivateWorkflowTemplateStep,
} from "../utils/apiServices";
import useAuthStore from "../store/authStore";

/**
 * The three step-config mutations for a single workflow template's detail
 * page -- add a step, edit a step, deactivate a step. Each refreshes that
 * template's cached detail (`["admin-workflow-template", templateId]`) plus
 * the admin directory list (its stepsCount column) on success.
 */
export const useWorkflowStepActions = (templateId) => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-workflow-template", templateId] });
    queryClient.invalidateQueries({ queryKey: ["admin-workflow-templates-list"] });
  };

  const addStep = useMutation({
    mutationFn: async (payload) => {
      const { data } = await addWorkflowTemplateStep(accessToken, templateId, payload);
      return data.data;
    },
    onSuccess: invalidate,
  });

  const updateStep = useMutation({
    mutationFn: async ({ stepId, payload }) => {
      const { data } = await updateWorkflowTemplateStep(accessToken, templateId, stepId, payload);
      return data.data;
    },
    onSuccess: invalidate,
  });

  const deactivateStep = useMutation({
    mutationFn: async (stepId) => {
      const { data } = await deactivateWorkflowTemplateStep(accessToken, templateId, stepId);
      return data.data;
    },
    onSuccess: invalidate,
  });

  return { addStep, updateStep, deactivateStep };
};
