import { PERMISSIONS } from '../../../shared/constants/lookup-values.js';
import { useAuth } from '../contexts/useAuth.js';

export function useOrgPermissions() {
  const { hasPermission, isLoading } = useAuth();

  return {
    // System-scoped org permissions
    canCreate: hasPermission(PERMISSIONS.ORGANIZATIONS_CREATE),
    canRead: hasPermission(PERMISSIONS.ORGANIZATIONS_READ),
    canUpdate: hasPermission(PERMISSIONS.ORGANIZATIONS_UPDATE),
    canDelete: hasPermission(PERMISSIONS.ORGANIZATIONS_DELETE),
    // Org-scoped permissions
    isLoading,
  };
}
