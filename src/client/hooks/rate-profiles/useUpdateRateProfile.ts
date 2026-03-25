import { useState } from 'react';
import { rateProfileAPI } from '../../lib/api/rate.profile.api.js';
import type {
  RateProfileResponse,
  UpdateRateProfileRequest,
} from '../../../shared/contracts/rate-profile-contracts.js';

interface UseUpdateRateProfileState {
  data: RateProfileResponse | null;
  loading: boolean;
  error: string | null;
}

interface UseUpdateRateProfileReturn extends UseUpdateRateProfileState {
  execute: (rateProfileId: number, data: UpdateRateProfileRequest) => Promise<void>;
}

export function useUpdateRateProfile(): UseUpdateRateProfileReturn {
  const [state, setState] = useState<UseUpdateRateProfileState>({
    data: null,
    loading: false,
    error: null,
  });

  async function execute(rateProfileId: number, data: UpdateRateProfileRequest): Promise<void> {
    setState({ data: null, loading: true, error: null });
    try {
      const updated = await rateProfileAPI.updateRateProfile(rateProfileId, data);
      setState({ data: updated, loading: false, error: null });
    } catch (err) {
      setState({ data: null, loading: false, error: (err as Error).message });
    }
  }

  return { ...state, execute };
}
