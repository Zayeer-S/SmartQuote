import { useState } from 'react';
import { quoteAPI } from '../../lib/api/quote.api.js';
import type {
  ApproveQuoteRequest,
  QuoteApprovalResponse,
} from '../../../shared/contracts/quote-contracts.js';

interface UseApproveQuoteState {
  data: QuoteApprovalResponse | null;
  loading: boolean;
  error: string | null;
}

interface UseApproveQuoteReturn extends UseApproveQuoteState {
  execute: (ticketId: string, quoteId: string, payload: ApproveQuoteRequest) => Promise<void>;
}

export function useApproveQuote(): UseApproveQuoteReturn {
  const [state, setState] = useState<UseApproveQuoteState>({
    data: null,
    loading: false,
    error: null,
  });

  async function execute(
    ticketId: string,
    quoteId: string,
    payload: ApproveQuoteRequest
  ): Promise<void> {
    setState({ data: null, loading: true, error: null });
    try {
      const data = await quoteAPI.approveQuote(ticketId, quoteId, payload);
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState({ data: null, loading: false, error: (err as Error).message });
    }
  }

  return { ...state, execute };
}
