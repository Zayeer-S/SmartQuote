import { useState } from 'react';
import { ticketAPI } from '../../lib/api/ticket.api.js';
import type { ListSimilarTicketsResponse } from '../../../shared/contracts/ticket-contracts.js';

interface UseGetSimilarTicketsState {
  data: ListSimilarTicketsResponse | null;
  loading: boolean;
  error: string | null;
}

interface UseGetSimilarTicketsReturn extends UseGetSimilarTicketsState {
  execute: (ticketId: string) => Promise<void>;
}

export function useGetSimilarTickets(): UseGetSimilarTicketsReturn {
  const [state, setState] = useState<UseGetSimilarTicketsState>({
    data: null,
    loading: false,
    error: null,
  });

  async function execute(ticketId: string): Promise<void> {
    setState({ data: null, loading: true, error: null });
    try {
      const data = await ticketAPI.getSimilarTickets(ticketId);
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState({ data: null, loading: false, error: (err as Error).message });
    }
  }

  return { ...state, execute };
}
