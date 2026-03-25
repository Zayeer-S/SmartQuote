import { useState } from 'react';
import { analyticsAPI } from '../../lib/api/analytics.api.js';
import type { QuoteAccuracyResponse } from '../../../shared/contracts/analytics-contract.js';

interface UseQuoteAccuracyState {
  data: QuoteAccuracyResponse | null;
  loading: boolean;
  error: string | null;
}

interface UseQuoteAccuracyReturn extends UseQuoteAccuracyState {
  execute: (from: string, to: string) => Promise<void>;
}

export function useQuoteAccuracy(): UseQuoteAccuracyReturn {
  const [state, setState] = useState<UseQuoteAccuracyState>({
    data: null,
    loading: false,
    error: null,
  });

  async function execute(from: string, to: string): Promise<void> {
    setState({ data: null, loading: true, error: null });
    try {
      const data = await analyticsAPI.getQuoteAccuracy(from, to);
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState({ data: null, loading: false, error: (err as Error).message });
    }
  }

  return { ...state, execute };
}
