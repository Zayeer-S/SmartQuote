import { useState } from 'react';
import { ticketAPI } from '../../lib/api/ticket.api.js';
import type {
  AssignTicketRequest,
  TicketResponse,
} from '../../../shared/contracts/ticket-contracts.js';

interface UseAssignTicketState {
  data: TicketResponse | null;
  loading: boolean;
  error: string | null;
}

interface UseAssignTicketReturn extends UseAssignTicketState {
  execute: (ticketId: string, payload: AssignTicketRequest) => Promise<void>;
}

export function useAssignTicket(): UseAssignTicketReturn {
  const [state, setState] = useState<UseAssignTicketState>({
    data: null,
    loading: false,
    error: null,
  });

  async function execute(ticketId: string, payload: AssignTicketRequest): Promise<void> {
    setState({ data: null, loading: true, error: null });
    try {
      const data = await ticketAPI.assignTicket(ticketId, payload);
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState({ data: null, loading: false, error: (err as Error).message });
    }
  }

  return { ...state, execute };
}
