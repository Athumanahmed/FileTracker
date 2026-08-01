import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createPosition } from "../utils/apiServices";
import useAuthStore from "../store/authStore";

/**
 * On success, invalidates the Positions directory's list/stats queries,
 * and the Units directory's list (since each unit row shows its own
 * positions count).
 */
export const useCreatePosition = () => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await createPosition(accessToken, payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-positions-list"] });
      queryClient.invalidateQueries({ queryKey: ["admin-position-stats"] });
      queryClient.invalidateQueries({ queryKey: ["admin-units-list"] });
      queryClient.invalidateQueries({ queryKey: ["admin-unit-stats"] });
    },
  });
};
