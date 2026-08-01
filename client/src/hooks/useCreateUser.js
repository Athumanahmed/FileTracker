import { useMutation, useQueryClient } from "@tanstack/react-query";
import useAuthStore from "../store/authStore";

/**
 * Every "create X" admin form (Director/HOD/Registry/Archive/ICT Admin/...)
 * hits a structurally identical endpoint -- same auth header, same
 * { user, defaultPassword } response shape -- so this one hook parameterized
 * by the specific apiServices function replaces five near-duplicate hooks.
 *
 * On success, invalidates the Users directory's list/stats queries so a
 * freshly created user shows up there immediately without a manual refresh.
 */
export const useCreateUser = (createFn) => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await createFn(accessToken, payload);
      return data.data; // { user, defaultPassword }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users-list"] });
      queryClient.invalidateQueries({ queryKey: ["admin-user-stats"] });
    },
  });
};
