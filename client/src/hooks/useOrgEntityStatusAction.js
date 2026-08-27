import { useMutation, useQueryClient } from "@tanstack/react-query";
import useAuthStore from "../store/authStore";

/**
 * Shared deactivate/reactivate mutation for the organizational catalog
 * entities (Department, Unit, Role, Permission). Every one of them exposes
 * structurally identical PATCH /:id/deactivate and /:id/reactivate
 * endpoints (no body, { ...entity } response) -- one hook parameterized by
 * the specific apiServices function, same pattern as
 * useAdminAccountStatusAction for user accounts.
 *
 * `invalidateKeys` is the list of React Query key prefixes to refresh on
 * success -- the directory list, its stat cards, and the isActive-only
 * lookup that feeds dropdowns elsewhere.
 */
export const useOrgEntityStatusAction = ({ actionFn, invalidateKeys = [] }) => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const { data } = await actionFn(accessToken, id);
      return data.data;
    },
    onSuccess: () => {
      for (const key of invalidateKeys) {
        queryClient.invalidateQueries({ queryKey: Array.isArray(key) ? key : [key] });
      }
    },
  });
};
