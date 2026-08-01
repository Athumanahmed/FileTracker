import { useQuery } from "@tanstack/react-query";
import { getUnits } from "../utils/apiServices";
import useAuthStore from "../store/authStore";

/** Active units, optionally scoped to a department (e.g. cascading Department -> Unit filters). */
export const useUnits = (departmentId) => {
  const accessToken = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: ["units", { isActive: true, departmentId: departmentId || null }],
    queryFn: async () => {
      const { data } = await getUnits(accessToken, {
        isActive: true,
        limit: 100,
        sortBy: "name",
        ...(departmentId ? { departmentId } : {}),
      });
      return data.data;
    },
    enabled: Boolean(accessToken),
    staleTime: 5 * 60 * 1000,
  });
};
