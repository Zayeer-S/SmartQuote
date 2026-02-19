import { useState } from 'react';
import { quoteAPI } from '../../lib/api/quote.api';
import type { QuoteResponse } from '../../../shared/contracts/quote-contracts';

interface UseSubmitForApprovalState {
  data: QuoteResponse | null;
  loading: boolean;
  error: string | null;
}

interface UseSubmitForApprovalReturn extends UseSubmitForApprovalState {
  execute: (ticketId: string, quoteId: string) => Promise<void>;
}

export function useSubmitForApproval(): UseSubmitForApprovalReturn {
  const [state, setState] = useState<UseSubmitForApprovalState>({
    data: null,
    loading: false,
    error: null,
  });

  async function execute(ticketId: string, quoteId: string): Promise<void> {
    setState({ data: null, loading: true, error: null });
    try {
      const data = await quoteAPI.submitForApproval(ticketId, quoteId);
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState({ data: null, loading: false, error: (err as Error).message });
    }
  }

  return { ...state, execute };
}
