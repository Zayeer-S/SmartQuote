import { useState } from 'react';
import { quoteAPI } from '../../lib/api/quote.api.js';
import type {
  CreateManualQuoteRequest,
  QuoteResponse,
} from '../../../shared/contracts/quote-contracts.js';

interface UseCreateManualQuoteState {
  data: QuoteResponse | null;
  loading: boolean;
  error: string | null;
}

interface UseCreateManualQuoteReturn extends UseCreateManualQuoteState {
  execute: (ticketId: string, payload: CreateManualQuoteRequest) => Promise<void>;
}

export function useCreateManualQuote(): UseCreateManualQuoteReturn {
  const [state, setState] = useState<UseCreateManualQuoteState>({
    data: null,
    loading: false,
    error: null,
  });

  async function execute(ticketId: string, payload: CreateManualQuoteRequest): Promise<void> {
    setState({ data: null, loading: true, error: null });
    try {
      const data = await quoteAPI.createManualQuote(ticketId, payload);
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState({ data: null, loading: false, error: (err as Error).message });
    }
  }

  return { ...state, execute };
}
