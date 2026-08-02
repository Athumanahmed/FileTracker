import { useMutation, useQueryClient } from "@tanstack/react-query";
import { syncRolePermissions } from "../utils/apiServices";
import useAuthStore from "../store/authStore";

/**
 * Replaces a role's entire permission set in one call (see
 * server/services/rolePermission.service.js's syncRolePermissions).
 * On success, invalidates that role's own grant set, the Roles directory
 * (each row shows its permissionsCount) and the Permissions directory
 * (each row shows its rolesCount, and "Unassigned" can change).
 */
export const useSyncRolePermissions = () => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ roleId, permissionIds }) => {
      const { data } = await syncRolePermissions(accessToken, { roleId, permissionIds });
      return data.data;
    },
    onSuccess: (_result, { roleId }) => {
      queryClient.invalidateQueries({ queryKey: ["role-permissions-for-role", roleId] });
      queryClient.invalidateQueries({ queryKey: ["admin-roles-list"] });
      queryClient.invalidateQueries({ queryKey: ["admin-role-stats"] });
      queryClient.invalidateQueries({ queryKey: ["admin-permissions-list"] });
      queryClient.invalidateQueries({ queryKey: ["admin-permission-stats"] });
    },
  });
};
