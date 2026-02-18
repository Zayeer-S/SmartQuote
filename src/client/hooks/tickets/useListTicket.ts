import { useState } from 'react';
import { ticketAPI } from '../../lib/api/ticket.api';
import type { ListTicketsResponse } from '../../../shared/contracts/ticket-contracts';

interface UseListTicketsState {
  data: ListTicketsResponse | null;
  loading: boolean;
  error: string | null;
}

interface UseListTicketsReturn extends UseListTicketsState {
  execute: () => Promise<void>;
}

export function useListTickets(): UseListTicketsReturn {
  const [state, setState] = useState<UseListTicketsState>({
    data: null,
    loading: false,
    error: null,
  });

  async function execute(): Promise<void> {
    setState({ data: null, loading: true, error: null });
    try {
      const data = await ticketAPI.listTickets();
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState({ data: null, loading: false, error: (err as Error).message });
    }
  }

  return { ...state, execute };
}
