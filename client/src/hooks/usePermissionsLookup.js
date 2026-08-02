import { useQuery } from "@tanstack/react-query";
import { getPermissions } from "../utils/apiServices";
import useAuthStore from "../store/authStore";
import { STALE_TIME } from "../utils/queryConfig";

/**
 * The full permission catalog (not paginated), for the Role Permissions
 * matrix -- unlike the Permissions directory's table, the matrix needs
 * every permission at once to group and toggle them. Includes inactive
 * permissions too (unlike useDepartments/useUnits/useRoles' isActive-only
 * lookups) so the matrix can still show a role's grant to a since-
 * deactivated permission rather than silently hiding it.
 */
export const usePermissionsLookup = () => {
  const accessToken = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: ["permissions-lookup"],
    queryFn: async () => {
      const { data } = await getPermissions(accessToken, { limit: 100, sortBy: "name" });
      return data.data;
    },
    enabled: Boolean(accessToken),
    staleTime: STALE_TIME.LONG,
  });
};
