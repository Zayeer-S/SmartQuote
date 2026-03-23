import { useState } from 'react';
import { orgAPI } from '../../lib/api/org.api.js';
import type { OrgResponse, UpdateOrgRequest } from '../../../shared/contracts/org-contracts.js';

interface UseUpdateOrgState {
  data: OrgResponse | null;
  loading: boolean;
  error: string | null;
}

interface UseUpdateOrgReturn extends UseUpdateOrgState {
  execute: (orgId: string, payload: UpdateOrgRequest) => Promise<void>;
}

export function useUpdateOrg(): UseUpdateOrgReturn {
  const [state, setState] = useState<UseUpdateOrgState>({
    data: null,
    loading: false,
    error: null,
  });

  async function execute(orgId: string, payload: UpdateOrgRequest): Promise<void> {
    setState({ data: null, loading: true, error: null });
    try {
      const data = await orgAPI.updateOrg(orgId, payload);
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState({ data: null, loading: false, error: (err as Error).message });
    }
  }

  return { ...state, execute };
}
