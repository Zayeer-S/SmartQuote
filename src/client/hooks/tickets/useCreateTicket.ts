import { useState } from 'react';
import type {
  CreateTicketRequest,
  TicketResponse,
} from '../../../shared/contracts/ticket-contracts';
import { ticketAPI } from '../../lib/api/ticket.api';

interface UseCreateTicketState {
  data: TicketResponse | null;
  loading: boolean;
  error: string | null;
}

interface UseCreateTicketReturn extends UseCreateTicketState {
  execute: (payload: CreateTicketRequest) => Promise<void>;
}

export function useCreateTicket(): UseCreateTicketReturn {
  const [state, setState] = useState<UseCreateTicketState>({
    data: null,
    loading: false,
    error: null,
  });

  async function execute(payload: CreateTicketRequest): Promise<void> {
    setState({ data: null, loading: true, error: null });
    try {
      const data = await ticketAPI.createTicket(payload);
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState({ data: null, loading: false, error: (err as Error).message });
    }
  }

  return { ...state, execute };
}
