import { useState } from 'react';
import { quoteAPI } from '../../lib/api/quote.api';
import type { QuoteWithApprovalResponse } from '../../../shared/contracts/quote-contracts';

interface UseGetQuoteState {
  data: QuoteWithApprovalResponse | null;
  loading: boolean;
  error: string | null;
}

interface UseGetQuoteReturn extends UseGetQuoteState {
  execute: (ticketId: string, quoteId: string) => Promise<void>;
}

export function useGetQuote(): UseGetQuoteReturn {
  const [state, setState] = useState<UseGetQuoteState>({
    data: null,
    loading: false,
    error: null,
  });

  async function execute(ticketId: string, quoteId: string): Promise<void> {
    setState({ data: null, loading: true, error: null });
    try {
      const data = await quoteAPI.getQuote(ticketId, quoteId);
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState({ data: null, loading: false, error: (err as Error).message });
    }
  }

  return { ...state, execute };
}
