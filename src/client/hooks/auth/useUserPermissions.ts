import { PERMISSIONS } from '../../../shared/constants/lookup-values';
import { useAuth } from './useAuth';

/**
 * Hook that provides user management permissions
 * Used by user-related features to determine what actions are allowed
 */
export function useUserPermissions() {
  const { hasPermission, isLoading } = useAuth();

  return {
    canCreate: hasPermission(PERMISSIONS.USERS_CREATE),
    canRead: hasPermission(PERMISSIONS.USERS_READ),
    canUpdate: hasPermission(PERMISSIONS.USERS_UPDATE),
    canDelete: hasPermission(PERMISSIONS.USERS_DELETE),
    canManageRoles: hasPermission(PERMISSIONS.USERS_MANAGE_ROLES),
    isLoading,
  };
}
