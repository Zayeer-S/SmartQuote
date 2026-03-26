import { useState } from 'react';
import { orgAPI } from '../../lib/api/org.api.js';
import type { OrgResponse } from '../../../shared/contracts/org-contracts.js';

interface UseGetOrgState {
  data: OrgResponse | null;
  loading: boolean;
  error: string | null;
}

interface UseGetOrgReturn extends UseGetOrgState {
  execute: (orgId: string) => Promise<void>;
}

export function useGetOrg(): UseGetOrgReturn {
  const [state, setState] = useState<UseGetOrgState>({
    data: null,
    loading: false,
    error: null,
  });

  async function execute(orgId: string): Promise<void> {
    setState({ data: null, loading: true, error: null });
    try {
      const data = await orgAPI.getOrg(orgId);
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState({ data: null, loading: false, error: (err as Error).message });
    }
  }

  return { ...state, execute };
}
