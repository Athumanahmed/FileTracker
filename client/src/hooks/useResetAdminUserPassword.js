import { useMutation } from "@tanstack/react-query";
import { resetAdminUserPassword } from "../utils/apiServices";
import useAuthStore from "../store/authStore";

/** Admin-initiated password reset -- returns { username, newPassword }, shown exactly once by the caller. No list invalidation needed: reset doesn't change anything the Users table displays. */
export const useResetAdminUserPassword = () => {
  const accessToken = useAuthStore((state) => state.accessToken);

  return useMutation({
    mutationFn: async (userId) => {
      const { data } = await resetAdminUserPassword(accessToken, userId);
      return data.data;
    },
  });
};
