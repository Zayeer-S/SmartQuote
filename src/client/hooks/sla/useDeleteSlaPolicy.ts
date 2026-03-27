import { useState } from 'react';
import { slaAPI } from '../../lib/api/sla.api.js';

interface UseDeleteSlaPolicyState {
  loading: boolean;
  error: string | null;
}

interface UseDeleteSlaPolicyReturn extends UseDeleteSlaPolicyState {
  execute: (slaPolicyId: number) => Promise<boolean>;
}

export function useDeleteSlaPolicy(): UseDeleteSlaPolicyReturn {
  const [state, setState] = useState<UseDeleteSlaPolicyState>({
    loading: false,
    error: null,
  });

  async function execute(slaPolicyId: number): Promise<boolean> {
    setState({ loading: true, error: null });
    try {
      await slaAPI.deletePolicy(slaPolicyId);
      setState({ loading: false, error: null });
      return true;
    } catch (err) {
      setState({ loading: false, error: (err as Error).message });
      return false;
    }
  }

  return { ...state, execute };
}
