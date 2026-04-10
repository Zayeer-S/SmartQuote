import { useState } from 'react';
import { quoteAPI } from '../../lib/api/quote.api.js';
import type { GenerateQuoteResponse } from '../../../shared/contracts/quote-contracts.js';

interface UseGenerateQuoteState {
  data: GenerateQuoteResponse | null;
  loading: boolean;
  error: string | null;
}

interface UseGenerateQuoteReturn extends UseGenerateQuoteState {
  execute: (ticketId: string) => Promise<GenerateQuoteResponse | null>;
}

export function useGenerateQuote(): UseGenerateQuoteReturn {
  const [state, setState] = useState<UseGenerateQuoteState>({
    data: null,
    loading: false,
    error: null,
  });

  async function execute(ticketId: string): Promise<GenerateQuoteResponse | null> {
    setState({ data: null, loading: true, error: null });
    try {
      const data = await quoteAPI.generateQuote(ticketId);
      setState({ data, loading: false, error: null });
      return data;
    } catch (err) {
      setState({ data: null, loading: false, error: (err as Error).message });
      return null;
    }
  }

  return { ...state, execute };
}
