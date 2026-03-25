import { useState } from 'react';
import { analyticsAPI } from '../../lib/api/analytics.api';
import type { TicketVolumeResponse } from '../../../shared/contracts/analytics-contract.js';

interface UseTicketVolumeState {
  data: TicketVolumeResponse | null;
  loading: boolean;
  error: string | null;
}

interface UseTicketVolumeReturn extends UseTicketVolumeState {
  execute: (from: string, to: string) => Promise<void>;
}

export function useTicketVolume(): UseTicketVolumeReturn {
  const [state, setState] = useState<UseTicketVolumeState>({
    data: null,
    loading: false,
    error: null,
  });

  async function execute(from: string, to: string): Promise<void> {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await analyticsAPI.getTicketVolume(from, to);
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState((prev) => ({ ...prev, loading: false, error: (err as Error).message }));
    }
  }

  return { ...state, execute };
}
