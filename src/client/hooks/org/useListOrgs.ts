import { useState } from 'react';
import { orgAPI } from '../../lib/api/org.api.js';
import type { ListOrgsResponse } from '../../../shared/contracts/org-contracts.js';

interface UseListOrgsState {
  data: ListOrgsResponse | null;
  loading: boolean;
  error: string | null;
}

interface UseListOrgsReturn extends UseListOrgsState {
  execute: () => Promise<void>;
}

export function useListOrgs(): UseListOrgsReturn {
  const [state, setState] = useState<UseListOrgsState>({
    data: null,
    loading: false,
    error: null,
  });

  async function execute(): Promise<void> {
    setState({ data: null, loading: true, error: null });
    try {
      const data = await orgAPI.listOrgs();
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState({ data: null, loading: false, error: (err as Error).message });
    }
  }

  return { ...state, execute };
}
