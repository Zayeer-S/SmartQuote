import { useState } from 'react';
import { notificationAPI } from '../../lib/api/notification.api.js';
import type { UpdateNotificationPreferencesResponse } from '../../../shared/contracts/notification-contracts.js';

interface UseUpdateNotificationPreferencesState {
  data: UpdateNotificationPreferencesResponse | null;
  loading: boolean;
  error: string | null;
}

interface UseUpdateNotificationPreferencesReturn extends UseUpdateNotificationPreferencesState {
  execute: (enabledNotificationTypeIds: number[]) => Promise<void>;
}

export function useUpdateNotificationPreferences(): UseUpdateNotificationPreferencesReturn {
  const [state, setState] = useState<UseUpdateNotificationPreferencesState>({
    data: null,
    loading: false,
    error: null,
  });

  async function execute(enabledNotificationTypeIds: number[]): Promise<void> {
    setState({ data: null, loading: true, error: null });
    try {
      const data = await notificationAPI.updateMyPreferences({ enabledNotificationTypeIds });
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState({ data: null, loading: false, error: (err as Error).message });
    }
  }

  return { ...state, execute };
}
