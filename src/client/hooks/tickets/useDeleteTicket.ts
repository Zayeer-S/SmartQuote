import { useState } from 'react';
import { ticketAPI } from '../../lib/api/ticket.api';

interface UseDeleteTicketState {
  loading: boolean;
  error: string | null;
  success: boolean;
}

interface UseDeleteTicketReturn extends UseDeleteTicketState {
  execute: (ticketId: string) => Promise<void>;
}

export function useDeleteTicket(): UseDeleteTicketReturn {
  const [state, setState] = useState<UseDeleteTicketState>({
    loading: false,
    error: null,
    success: false,
  });

  async function execute(ticketId: string): Promise<void> {
    setState({ loading: true, error: null, success: false });
    try {
      await ticketAPI.deleteTicket(ticketId);
      setState({ loading: false, error: null, success: true });
    } catch (err) {
      setState({ loading: false, error: (err as Error).message, success: false });
    }
  }

  return { ...state, execute };
}
