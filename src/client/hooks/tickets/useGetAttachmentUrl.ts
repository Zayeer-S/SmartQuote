import { useState } from 'react';
import { ticketAPI } from '../../lib/api/ticket.api.js';

interface UseGetAttachmentUrlState {
  loading: boolean;
  error: string | null;
}

interface UseGetAttachmentUrlReturn extends UseGetAttachmentUrlState {
  /** Fetches a presigned URL and opens it in a new tab. */
  openAttachment: (ticketId: string, attachmentId: string) => Promise<void>;
}

export function useGetAttachmentUrl(): UseGetAttachmentUrlReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openAttachment = async (ticketId: string, attachmentId: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const { url } = await ticketAPI.getAttachmentUrl(ticketId, attachmentId);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open attachment');
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, openAttachment };
}
