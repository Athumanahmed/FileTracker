import { useQuery } from "@tanstack/react-query";
import { getRolePermissions } from "../utils/apiServices";
import useAuthStore from "../store/authStore";
import { STALE_TIME } from "../utils/queryConfig";

/** The set of permission ids currently granted to one role, for the matrix's initial checked state. */
export const useRolePermissionsForRole = (roleId) => {
  const accessToken = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: ["role-permissions-for-role", roleId],
    queryFn: async () => {
      const { data } = await getRolePermissions(accessToken, { roleId, limit: 100 });
      return new Set(data.data.map((assignment) => assignment.permissionId));
    },
    enabled: Boolean(accessToken) && Boolean(roleId),
    staleTime: STALE_TIME.SHORT,
  });
};
