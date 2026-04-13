import { PERMISSIONS } from '../../../shared/constants/lookup-values.js';
import { useAuth } from '../contexts/useAuth.js';

/**
 * Hook that provides quote management permissions.
 * Each flag maps 1:1 to a permission in lookup-values.ts.
 */
export function useQuotePermissions() {
  const { hasPermission, isLoading } = useAuth();

  return {
    canCreate: hasPermission(PERMISSIONS.QUOTES_CREATE),
    canReadOwn: hasPermission(PERMISSIONS.QUOTES_READ_OWN),
    canReadAll: hasPermission(PERMISSIONS.QUOTES_READ_ALL),
    canUpdate: hasPermission(PERMISSIONS.QUOTES_UPDATE),
    canAgentApprove: hasPermission(PERMISSIONS.QUOTES_AGENT_APPROVE),
    canManagerApprove: hasPermission(PERMISSIONS.QUOTES_MANAGER_APPROVE),
    canManagerReject: hasPermission(PERMISSIONS.QUOTES_MANAGER_REJECT),
    canAdminApprove: hasPermission(PERMISSIONS.QUOTES_ADMIN_APPROVE),
    canCustomerApprove: hasPermission(PERMISSIONS.QUOTES_CUSTOMER_APPROVE),
    canCustomerReject: hasPermission(PERMISSIONS.QUOTES_CUSTOMER_REJECT),
    canDelete: hasPermission(PERMISSIONS.QUOTES_DELETE),
    isLoading,
  };
}
