import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createPermission } from "../utils/apiServices";
import useAuthStore from "../store/authStore";

/**
 * On success, invalidates the Permissions directory's list/stats queries.
 * Unlike Department/Unit/Role, there's no "permissions" lookup query used
 * for dropdowns elsewhere in the app yet, so there's nothing further to
 * invalidate.
 */
export const useCreatePermission = () => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await createPermission(accessToken, payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-permissions-list"] });
      queryClient.invalidateQueries({ queryKey: ["admin-permission-stats"] });
    },
  });
};
