import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createDepartment } from "../utils/apiServices";
import useAuthStore from "../store/authStore";

/**
 * On success, invalidates the Departments directory's list/stats queries
 * (so the new department shows up there immediately) and the "departments"
 * lookup query (see useDepartments.js) that populates dropdowns elsewhere
 * -- e.g. the HOD-creation form and the Users filter bar -- so a freshly
 * created department is selectable there too without a manual refresh.
 */
export const useCreateDepartment = () => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await createDepartment(accessToken, payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-departments-list"] });
      queryClient.invalidateQueries({ queryKey: ["admin-department-stats"] });
      queryClient.invalidateQueries({ queryKey: ["departments"] });
    },
  });
};
