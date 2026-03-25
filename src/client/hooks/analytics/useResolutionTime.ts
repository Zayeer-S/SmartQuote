import { useState } from 'react';
import { analyticsAPI } from '../../lib/api/analytics.api.js';
import type { ResolutionTimeResponse } from '../../../shared/contracts/analytics-contract.js';

interface UseResolutionTimeState {
  data: ResolutionTimeResponse | null;
  loading: boolean;
  error: string | null;
}

interface UseResolutionTimeReturn extends UseResolutionTimeState {
  execute: (from: string, to: string) => Promise<void>;
}

export function useResolutionTime(): UseResolutionTimeReturn {
  const [state, setState] = useState<UseResolutionTimeState>({
    data: null,
    loading: false,
    error: null,
  });

  async function execute(from: string, to: string): Promise<void> {
    setState({ data: null, loading: true, error: null });
    try {
      const data = await analyticsAPI.getResolutionTime(from, to);
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState({ data: null, loading: false, error: (err as Error).message });
    }
  }

  return { ...state, execute };
}
