// src/client/hooks/tickets/useListTicket.ts

import { useState } from 'react';
import { ticketAPI } from '../../lib/api/ticket.api.js';
import type { ListTicketsResponse } from '../../../shared/contracts/ticket-contracts.js';

interface UseListTicketsState {
  data: ListTicketsResponse | null;
  loading: boolean;
  error: string | null;
}

interface UseListTicketsParams {
  from?: string;
  to?: string;
  ticketStatus?: string;
  organizationId?: string;
  assigneeId?: string;
  limit?: number;
  offset?: number;
}

interface UseListTicketsReturn extends UseListTicketsState {
  execute: (params?: UseListTicketsParams) => Promise<void>;
}

export function useListTickets(): UseListTicketsReturn {
  const [state, setState] = useState<UseListTicketsState>({
    data: null,
    loading: false,
    error: null,
  });

  async function execute(params?: UseListTicketsParams): Promise<void> {
    setState({ data: null, loading: true, error: null });
    try {
      const data = await ticketAPI.listTickets(params);
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState({ data: null, loading: false, error: (err as Error).message });
    }
  }

  return { ...state, execute };
}
