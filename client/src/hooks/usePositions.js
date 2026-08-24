import { useQuery } from "@tanstack/react-query";
import { getPositions } from "../utils/apiServices";
import useAuthStore from "../store/authStore";
import { STALE_TIME } from "../utils/queryConfig";

/** Active positions scoped to a unit (e.g. cascading Department -> Unit -> Position dropdowns). Empty until a unitId is given. */
export const usePositions = (unitId) => {
  const accessToken = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: ["positions", { isActive: true, unitId: unitId || null }],
    queryFn: async () => {
      const { data } = await getPositions(accessToken, {
        isActive: true,
        limit: 100,
        sortBy: "name",
        unitId,
      });
      return data.data;
    },
    enabled: Boolean(accessToken) && Boolean(unitId),
    staleTime: STALE_TIME.LONG,
  });
};
