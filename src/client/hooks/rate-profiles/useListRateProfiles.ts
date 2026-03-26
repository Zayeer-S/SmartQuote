import { useState } from 'react';
import { rateProfileAPI } from '../../lib/api/rate.profile.api.js';
import type { ListRateProfilesResponse } from '../../../shared/contracts/rate-profile-contracts.js';

interface UseListRateProfilesState {
  data: ListRateProfilesResponse | null;
  loading: boolean;
  error: string | null;
}

interface UseListRateProfilesReturn extends UseListRateProfilesState {
  execute: () => Promise<void>;
}

export function useListRateProfiles(): UseListRateProfilesReturn {
  const [state, setState] = useState<UseListRateProfilesState>({
    data: null,
    loading: false,
    error: null,
  });

  async function execute(): Promise<void> {
    setState({ data: null, loading: true, error: null });
    try {
      const data = await rateProfileAPI.listRateProfiles();
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState({ data: null, loading: false, error: (err as Error).message });
    }
  }

  return { ...state, execute };
}
