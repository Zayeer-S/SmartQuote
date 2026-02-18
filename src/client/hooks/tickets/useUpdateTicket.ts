import { useState } from 'react';
import { ticketAPI } from '../../lib/api/ticket.api';
import type {
  UpdateTicketRequest,
  TicketResponse,
} from '../../../shared/contracts/ticket-contracts';

interface UseUpdateTicketState {
  data: TicketResponse | null;
  loading: boolean;
  error: string | null;
}

interface UseUpdateTicketReturn extends UseUpdateTicketState {
  execute: (ticketId: string, payload: UpdateTicketRequest) => Promise<void>;
}

export function useUpdateTicket(): UseUpdateTicketReturn {
  const [state, setState] = useState<UseUpdateTicketState>({
    data: null,
    loading: false,
    error: null,
  });

  async function execute(ticketId: string, payload: UpdateTicketRequest): Promise<void> {
    setState({ data: null, loading: true, error: null });
    try {
      const data = await ticketAPI.updateTicket(ticketId, payload);
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState({ data: null, loading: false, error: (err as Error).message });
    }
  }

  return { ...state, execute };
}
