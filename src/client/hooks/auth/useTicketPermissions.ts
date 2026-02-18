import { PERMISSIONS } from '../../../shared/constants';
import { useAuth } from './useAuth';

/**
 * Hook that provides ticket management permissions
 * Used by ticket-related features to determine what actions are allowed
 */
export function useTicketPermissions() {
  const { hasPermission, isLoading } = useAuth();

  return {
    canCreate: hasPermission(PERMISSIONS.TICKETS_CREATE),
    canReadOwn: hasPermission(PERMISSIONS.TICKETS_READ_OWN),
    canReadAll: hasPermission(PERMISSIONS.TICKETS_READ_ALL),
    canUpdateOwn: hasPermission(PERMISSIONS.TICKETS_UPDATE_OWN),
    canUpdateAll: hasPermission(PERMISSIONS.TICKETS_UPDATE_ALL),
    canDeleteOwn: hasPermission(PERMISSIONS.TICKETS_DELETE_OWN),
    canDeleteAll: hasPermission(PERMISSIONS.TICKETS_DELETE_ALL),
    canAssign: hasPermission(PERMISSIONS.TICKETS_ASSIGN),
    isLoading,
  };
}
