import { useState } from 'react';
import { notificationAPI } from '../../lib/api/notification.api.js';
import type { GetNotificationPreferencesResponse } from '../../../shared/contracts/notification-contracts.js';

interface UseGetNotificationPreferencesState {
  data: GetNotificationPreferencesResponse | null;
  loading: boolean;
  error: string | null;
}

interface UseGetNotificationPreferencesReturn extends UseGetNotificationPreferencesState {
  execute: () => Promise<void>;
}

export function useGetNotificationPreferences(): UseGetNotificationPreferencesReturn {
  const [state, setState] = useState<UseGetNotificationPreferencesState>({
    data: null,
    loading: false,
    error: null,
  });

  async function execute(): Promise<void> {
    setState({ data: null, loading: true, error: null });
    try {
      const data = await notificationAPI.getMyPreferences();
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState({ data: null, loading: false, error: (err as Error).message });
    }
  }

  return { ...state, execute };
}
