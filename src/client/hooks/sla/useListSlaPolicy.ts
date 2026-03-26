import { useState } from 'react';
import { slaAPI } from '../../lib/api/sla.api.js';
import type { ListSlaPoliciesResponse } from '../../../shared/contracts/sla-contracts.js';

interface UseListSlaPoliciesState {
  data: ListSlaPoliciesResponse | null;
  loading: boolean;
  error: string | null;
}

interface UseListSlaPoliciesReturn extends UseListSlaPoliciesState {
  execute: () => Promise<void>;
}

export function useListSlaPolicies(): UseListSlaPoliciesReturn {
  const [state, setState] = useState<UseListSlaPoliciesState>({
    data: null,
    loading: false,
    error: null,
  });

  async function execute(): Promise<void> {
    setState({ data: null, loading: true, error: null });
    try {
      const data = await slaAPI.listPolicies();
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState({ data: null, loading: false, error: (err as Error).message });
    }
  }

  return { ...state, execute };
}
