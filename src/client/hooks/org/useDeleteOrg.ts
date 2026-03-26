import { useState } from 'react';
import { orgAPI } from '../../lib/api/org.api.js';

interface UseDeleteOrgState {
  loading: boolean;
  error: string | null;
}

interface UseDeleteOrgReturn extends UseDeleteOrgState {
  execute: (orgId: string) => Promise<void>;
}

export function useDeleteOrg(): UseDeleteOrgReturn {
  const [state, setState] = useState<UseDeleteOrgState>({
    loading: false,
    error: null,
  });

  async function execute(orgId: string): Promise<void> {
    setState({ loading: true, error: null });
    try {
      await orgAPI.deleteOrg(orgId);
      setState({ loading: false, error: null });
    } catch (err) {
      setState({ loading: false, error: (err as Error).message });
    }
  }

  return { ...state, execute };
}
