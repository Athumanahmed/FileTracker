import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createRole } from "../utils/apiServices";
import useAuthStore from "../store/authStore";

/**
 * On success, invalidates the Roles directory's list/stats queries and the
 * "roles" lookup query (see useRoles.js) that populates dropdowns
 * elsewhere -- e.g. the Users filter bar -- so a freshly created role is
 * selectable there too without a manual refresh.
 */
export const useCreateRole = () => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await createRole(accessToken, payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-roles-list"] });
      queryClient.invalidateQueries({ queryKey: ["admin-role-stats"] });
      queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
  });
};
