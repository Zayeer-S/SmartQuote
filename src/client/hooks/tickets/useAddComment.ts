import { useState } from 'react';
import { ticketAPI } from '../../lib/api/ticket.api.js';
import type {
  AddCommentRequest,
  CommentResponse,
} from '../../../shared/contracts/ticket-contracts.js';

interface UseAddCommentState {
  data: CommentResponse | null;
  loading: boolean;
  error: string | null;
}

interface UseAddCommentReturn extends UseAddCommentState {
  execute: (ticketId: string, payload: AddCommentRequest) => Promise<void>;
}

export function useAddComment(): UseAddCommentReturn {
  const [state, setState] = useState<UseAddCommentState>({
    data: null,
    loading: false,
    error: null,
  });

  async function execute(ticketId: string, payload: AddCommentRequest): Promise<void> {
    setState({ data: null, loading: true, error: null });
    try {
      const data = await ticketAPI.addComment(ticketId, payload);
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState({ data: null, loading: false, error: (err as Error).message });
    }
  }

  return { ...state, execute };
}
