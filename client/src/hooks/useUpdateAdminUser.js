import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateAdminUser } from "../utils/apiServices";
import useAuthStore from "../store/authStore";

/** Admin's "Edit User" form -- department/unit/position/contact fields only (see server/services/adminUserUpdate.service.js). */
export const useUpdateAdminUser = () => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, payload }) => {
      const { data } = await updateAdminUser(accessToken, userId, payload);
      return data.data;
    },
    onSuccess: (_data, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users-list"] });
      queryClient.invalidateQueries({ queryKey: ["admin-user-detail", userId] });
    },
  });
};
