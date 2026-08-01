import { useQuery } from "@tanstack/react-query";
import { getRoles } from "../utils/apiServices";
import useAuthStore from "../store/authStore";

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
    staleTime: 5 * 60 * 1000,
  });
};
