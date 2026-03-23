import { useState } from 'react';
import { orgAPI } from '../../lib/api/org.api.js';
import type { OrgResponse } from '../../../shared/contracts/org-contracts.js';

interface UseGetMyOrgState {
  data: OrgResponse | null;
  loading: boolean;
  error: string | null;
}

interface UseGetMyOrgReturn extends UseGetMyOrgState {
  execute: () => Promise<void>;
}

export function useGetMyOrg(): UseGetMyOrgReturn {
  const [state, setState] = useState<UseGetMyOrgState>({
    data: null,
    loading: false,
    error: null,
  });

  async function execute(): Promise<void> {
    setState({ data: null, loading: true, error: null });
    try {
      const data = await orgAPI.getMyOrg();
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState({ data: null, loading: false, error: (err as Error).message });
    }
  }

  return { ...state, execute };
}
