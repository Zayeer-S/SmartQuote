import { useState } from 'react';
import { quoteAPI } from '../../lib/api/quote.api';
import type { UpdateQuoteRequest, QuoteResponse } from '../../../shared/contracts/quote-contracts';

interface UseUpdateQuoteState {
  data: QuoteResponse | null;
  loading: boolean;
  error: string | null;
}

interface UseUpdateQuoteReturn extends UseUpdateQuoteState {
  execute: (ticketId: string, quoteId: string, payload: UpdateQuoteRequest) => Promise<void>;
}

export function useUpdateQuote(): UseUpdateQuoteReturn {
  const [state, setState] = useState<UseUpdateQuoteState>({
    data: null,
    loading: false,
    error: null,
  });

  async function execute(
    ticketId: string,
    quoteId: string,
    payload: UpdateQuoteRequest
  ): Promise<void> {
    setState({ data: null, loading: true, error: null });
    try {
      const data = await quoteAPI.updateQuote(ticketId, quoteId, payload);
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState({ data: null, loading: false, error: (err as Error).message });
    }
  }

  return { ...state, execute };
}
