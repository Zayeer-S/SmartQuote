import { useState } from 'react';
import type {
  CreateTicketRequest,
  TicketResponse,
} from '../../../shared/contracts/ticket-contracts.js';
import { ticketAPI } from '../../lib/api/ticket.api.js';

interface UseCreateTicketState {
  data: TicketResponse | null;
  loading: boolean;
}

interface UseCreateTicketReturn extends UseCreateTicketState {
  execute: (payload: CreateTicketRequest) => Promise<TicketResponse>;
}

export function useCreateTicket(): UseCreateTicketReturn {
  const [state, setState] = useState<UseCreateTicketState>({
    data: null,
    loading: false,
  });

  async function execute(payload: CreateTicketRequest): Promise<TicketResponse> {
    setState({ data: null, loading: true });
    try {
      const data = await ticketAPI.createTicket(payload);
      setState({ data, loading: false });
      return data;
    } catch (err) {
      setState({ data: null, loading: false });
      throw err;
    }
  }

  return { ...state, execute };
}
