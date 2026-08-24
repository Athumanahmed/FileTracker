import { useMutation, useQueryClient } from "@tanstack/react-query";
import useAuthStore from "../store/authStore";

/**
 * Activate/Deactivate/Lock/Unlock all hit structurally identical endpoints
 * (PATCH, no body, { id, status, isActive, updatedAt } response) -- one
 * hook parameterized by the specific apiServices function, same pattern as
 * useCreateUser. Invalidates the Users directory's list/stats so the
 * row's status badge and stat cards update immediately.
 */
export const useAdminAccountStatusAction = (actionFn) => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId) => {
      const { data } = await actionFn(accessToken, userId);
      return data.data;
    },
    onSuccess: (_data, userId) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users-list"] });
      queryClient.invalidateQueries({ queryKey: ["admin-user-stats"] });
      queryClient.invalidateQueries({ queryKey: ["admin-user-detail", userId] });
    },
  });
};
