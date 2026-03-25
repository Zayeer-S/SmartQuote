import { useState } from 'react';
import { rateProfileAPI } from '../../lib/api/rate.profile.api.js';
import type {
  CreateRateProfileRequest,
  RateProfileResponse,
} from '../../../shared/contracts/rate-profile-contracts.js';

interface UseCreateRateProfileState {
  data: RateProfileResponse | null;
  loading: boolean;
  error: string | null;
}

interface UseCreateRateProfileReturn extends UseCreateRateProfileState {
  execute: (data: CreateRateProfileRequest) => Promise<void>;
}

export function useCreateRateProfile(): UseCreateRateProfileReturn {
  const [state, setState] = useState<UseCreateRateProfileState>({
    data: null,
    loading: false,
    error: null,
  });

  async function execute(data: CreateRateProfileRequest): Promise<void> {
    setState({ data: null, loading: true, error: null });
    try {
      const created = await rateProfileAPI.createRateProfile(data);
      setState({ data: created, loading: false, error: null });
    } catch (err) {
      setState({ data: null, loading: false, error: (err as Error).message });
    }
  }

  return { ...state, execute };
}
