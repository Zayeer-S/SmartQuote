import { useState } from 'react';
import { quoteAPI } from '../../lib/api/quote.api.js';
import type { ListRevisionsResponse } from '../../../shared/contracts/quote-contracts.js';

interface UseGetRevisionHistoryState {
  data: ListRevisionsResponse | null;
  loading: boolean;
  error: string | null;
}

interface UseGetRevisionHistoryReturn extends UseGetRevisionHistoryState {
  execute: (ticketId: string, quoteId: string) => Promise<void>;
}

export function useGetRevisionHistory(): UseGetRevisionHistoryReturn {
  const [state, setState] = useState<UseGetRevisionHistoryState>({
    data: null,
    loading: false,
    error: null,
  });

  async function execute(ticketId: string, quoteId: string): Promise<void> {
    setState({ data: null, loading: true, error: null });
    try {
      const data = await quoteAPI.getRevisionHistory(ticketId, quoteId);
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState({ data: null, loading: false, error: (err as Error).message });
    }
  }

  return { ...state, execute };
}
