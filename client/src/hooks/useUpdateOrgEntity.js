import { useMutation, useQueryClient } from "@tanstack/react-query";
import useAuthStore from "../store/authStore";

/**
 * Shared "edit an organizational catalog entity" mutation -- Department,
 * Unit, Role, and Permission all expose a structurally identical
 * PUT /:id (partial body, { ...entity } response), so one hook
 * parameterized by the specific apiServices function + the query keys to
 * refresh afterward, same pattern as useAdminAccountStatusAction.
 *
 * `invalidateKeys` is the list of React Query key prefixes to invalidate on
 * success -- typically the directory list, its stat cards, and the
 * isActive-only lookup that feeds dropdowns elsewhere.
 */
export const useUpdateOrgEntity = ({ updateFn, invalidateKeys = [] }) => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }) => {
      const { data } = await updateFn(accessToken, id, payload);
      return data.data;
    },
    onSuccess: () => {
      for (const key of invalidateKeys) {
        queryClient.invalidateQueries({ queryKey: Array.isArray(key) ? key : [key] });
      }
    },
  });
};
