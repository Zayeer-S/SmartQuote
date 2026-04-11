import { useState } from 'react';
import { orgAPI } from '../../lib/api/org.api.js';

interface UseDeleteOrgState {
  loading: boolean;
  error: string | null;
}

interface UseDeleteOrgReturn extends UseDeleteOrgState {
  execute: (orgId: string) => Promise<string | null>;
}

export function useDeleteOrg(): UseDeleteOrgReturn {
  const [state, setState] = useState<UseDeleteOrgState>({
    loading: false,
    error: null,
  });

  async function execute(orgId: string): Promise<string | null> {
    setState({ loading: true, error: null });
    try {
      await orgAPI.deleteOrg(orgId);
      setState({ loading: false, error: null });
      return null;
    } catch (err) {
      const message = (err as Error).message;
      setState({ loading: false, error: message });
      return message;
    }
  }

  return { ...state, execute };
}
