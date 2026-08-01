import { useQuery } from "@tanstack/react-query";
import { getRoles } from "../utils/apiServices";
import useAuthStore from "../store/authStore";
import { STALE_TIME } from "../utils/queryConfig";

/** Active roles, for dropdowns (e.g. the Users directory's role filter). */
export const useRoles = () => {
  const accessToken = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: ["roles", { isActive: true }],
    queryFn: async () => {
      const { data } = await getRoles(accessToken, { isActive: true, limit: 100, sortBy: "name" });
      return data.data;
    },
    enabled: Boolean(accessToken),
    staleTime: STALE_TIME.LONG,
  });
};
