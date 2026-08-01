import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createUnit } from "../utils/apiServices";
import useAuthStore from "../store/authStore";

/**
 * On success, invalidates the Units directory's list/stats queries and
 * every "units" lookup query (see useUnits.js -- keyed per departmentId,
 * hence the prefix-only match) that populates dropdowns elsewhere, e.g.
 * the Users filter bar, so a freshly created unit is selectable there too
 * without a manual refresh. Also invalidates the Departments directory's
 * list, since each department row shows its own units count.
 */
export const useCreateUnit = () => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await createUnit(accessToken, payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-units-list"] });
      queryClient.invalidateQueries({ queryKey: ["admin-unit-stats"] });
      queryClient.invalidateQueries({ queryKey: ["units"] });
      queryClient.invalidateQueries({ queryKey: ["admin-departments-list"] });
      queryClient.invalidateQueries({ queryKey: ["admin-department-stats"] });
    },
  });
};
