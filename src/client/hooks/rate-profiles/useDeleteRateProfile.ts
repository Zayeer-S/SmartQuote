import { useState } from 'react';
import { rateProfileAPI } from '../../lib/api/rate.profile.api.js';

interface UseDeleteRateProfileState {
  loading: boolean;
  error: string | null;
}

interface UseDeleteRateProfileReturn extends UseDeleteRateProfileState {
  execute: (rateProfileId: number) => Promise<void>;
}

export function useDeleteRateProfile(): UseDeleteRateProfileReturn {
  const [state, setState] = useState<UseDeleteRateProfileState>({
    loading: false,
    error: null,
  });

  async function execute(rateProfileId: number): Promise<void> {
    setState({ loading: true, error: null });
    try {
      await rateProfileAPI.deleteRateProfile(rateProfileId);
      setState({ loading: false, error: null });
    } catch (err) {
      setState({ loading: false, error: (err as Error).message });
    }
  }

  return { ...state, execute };
}
