import { useState } from 'react';
import { ticketAPI } from '../../lib/api/ticket.api';
import type { TicketDetailResponse } from '../../../shared/contracts/ticket-contracts';

interface UseGetTicketState {
  data: TicketDetailResponse | null;
  loading: boolean;
  error: string | null;
}

interface UseGetTicketReturn extends UseGetTicketState {
  execute: (ticketId: string) => Promise<void>;
}

export function useGetTicket(): UseGetTicketReturn {
  const [state, setState] = useState<UseGetTicketState>({
    data: null,
    loading: false,
    error: null,
  });

  async function execute(ticketId: string): Promise<void> {
    setState({ data: null, loading: true, error: null });
    try {
      const data = await ticketAPI.getTicket(ticketId);
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState({ data: null, loading: false, error: (err as Error).message });
    }
  }

  return { ...state, execute };
}
