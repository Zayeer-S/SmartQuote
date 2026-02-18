import { useState } from 'react';
import { ticketAPI } from '../../lib/api/ticket.api';
import type { ListCommentsResponse } from '../../../shared/contracts/ticket-contracts';

interface UseListCommentsState {
  data: ListCommentsResponse | null;
  loading: boolean;
  error: string | null;
}

interface UseListCommentsReturn extends UseListCommentsState {
  execute: (ticketId: string) => Promise<void>;
}

export function useListComments(): UseListCommentsReturn {
  const [state, setState] = useState<UseListCommentsState>({
    data: null,
    loading: false,
    error: null,
  });

  async function execute(ticketId: string): Promise<void> {
    setState({ data: null, loading: true, error: null });
    try {
      const data = await ticketAPI.listComments(ticketId);
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState({ data: null, loading: false, error: (err as Error).message });
    }
  }

  return { ...state, execute };
}
