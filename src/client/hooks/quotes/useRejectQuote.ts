import { useState } from 'react';
import { quoteAPI } from '../../lib/api/quote.api';
import type {
  RejectQuoteRequest,
  QuoteApprovalResponse,
} from '../../../shared/contracts/quote-contracts';

interface UseRejectQuoteState {
  data: QuoteApprovalResponse | null;
  loading: boolean;
  error: string | null;
}

interface UseRejectQuoteReturn extends UseRejectQuoteState {
  execute: (ticketId: string, quoteId: string, payload: RejectQuoteRequest) => Promise<void>;
}

export function useRejectQuote(): UseRejectQuoteReturn {
  const [state, setState] = useState<UseRejectQuoteState>({
    data: null,
    loading: false,
    error: null,
  });

  async function execute(
    ticketId: string,
    quoteId: string,
    payload: RejectQuoteRequest
  ): Promise<void> {
    setState({ data: null, loading: true, error: null });
    try {
      const data = await quoteAPI.rejectQuote(ticketId, quoteId, payload);
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState({ data: null, loading: false, error: (err as Error).message });
    }
  }

  return { ...state, execute };
}
