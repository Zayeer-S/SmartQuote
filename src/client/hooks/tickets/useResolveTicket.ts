import { useState } from 'react';
import { ticketAPI } from '../../lib/api/ticket.api';
import type { TicketResponse } from '../../../shared/contracts/ticket-contracts';

interface UseResolveTicketState {
  data: TicketResponse | null;
  loading: boolean;
  error: string | null;
}

interface UseResolveTicketReturn extends UseResolveTicketState {
  execute: (ticketId: string) => Promise<void>;
}

export function useResolveTicket(): UseResolveTicketReturn {
  const [state, setState] = useState<UseResolveTicketState>({
    data: null,
    loading: false,
    error: null,
  });

  async function execute(ticketId: string): Promise<void> {
    setState({ data: null, loading: true, error: null });
    try {
      const data = await ticketAPI.resolveTicket(ticketId);
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState({ data: null, loading: false, error: (err as Error).message });
    }
  }

  return { ...state, execute };
}
