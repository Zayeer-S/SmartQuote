import { PERMISSIONS } from '../../../shared/constants/lookup-values';
import { useAuth } from './useAuth';

/**
 * Hook that provides quote management permissions
 * Used by quote-related features to determine what actions are allowed
 */
export function useQuotePermissions() {
  const { hasPermission, isLoading } = useAuth();

  return {
    canCreate: hasPermission(PERMISSIONS.QUOTES_CREATE),
    canReadOwn: hasPermission(PERMISSIONS.QUOTES_READ_OWN),
    canReadAll: hasPermission(PERMISSIONS.QUOTES_READ_ALL),
    canUpdate: hasPermission(PERMISSIONS.QUOTES_UPDATE),
    canApprove: hasPermission(PERMISSIONS.QUOTES_APPROVE),
    canReject: hasPermission(PERMISSIONS.QUOTES_REJECT),
    canDelete: hasPermission(PERMISSIONS.QUOTES_DELETE),
    isLoading,
  };
}
