import { useState } from 'react';
import type { ListQuotesResponse } from '../../../shared/contracts/quote-contracts.js';
import { quoteAPI } from '../../lib/api/quote.api.js';

interface UseListQuotesState {
  data: ListQuotesResponse | null;
  loading: boolean;
  error: string | null;
}

interface UseListQuotesReturn extends UseListQuotesState {
  execute: (ticketId: string) => Promise<void>;
}

export function useListQuotes(): UseListQuotesReturn {
  const [state, setState] = useState<UseListQuotesState>({
    data: null,
    loading: false,
    error: null,
  });

  async function execute(ticketId: string): Promise<void> {
    setState({ data: null, loading: true, error: null });
    try {
      const data = await quoteAPI.listQuotes(ticketId);
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState({ data: null, loading: false, error: (err as Error).message });
    }
  }

  return { ...state, execute };
}
