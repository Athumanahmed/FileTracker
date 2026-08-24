import { useQuery } from "@tanstack/react-query";
import { getAdminUserById } from "../utils/apiServices";
import useAuthStore from "../store/authStore";
import { STALE_TIME } from "../utils/queryConfig";

/** Single user's full admin detail record -- powers View Details and prefills Edit User. `userId` is null while no row is targeted. */
export const useAdminUserDetail = (userId) => {
  const accessToken = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: ["admin-user-detail", userId],
    queryFn: async () => {
      const { data } = await getAdminUserById(accessToken, userId);
      return data.data;
    },
    enabled: Boolean(accessToken) && Boolean(userId),
    staleTime: STALE_TIME.SHORT,
  });
};
