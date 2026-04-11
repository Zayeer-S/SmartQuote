import { useState } from 'react';
import { orgAPI } from '../../lib/api/org.api.js';
import type { OrgResponse, UpdateOrgRequest } from '../../../shared/contracts/org-contracts.js';

interface UseUpdateOrgState {
  data: OrgResponse | null;
  loading: boolean;
  error: string | null;
}

interface UseUpdateOrgReturn extends UseUpdateOrgState {
  execute: (orgId: string, payload: UpdateOrgRequest) => Promise<string | null>;
}

export function useUpdateOrg(): UseUpdateOrgReturn {
  const [state, setState] = useState<UseUpdateOrgState>({
    data: null,
    loading: false,
    error: null,
  });

  async function execute(orgId: string, payload: UpdateOrgRequest): Promise<string | null> {
    setState({ data: null, loading: true, error: null });
    try {
      const data = await orgAPI.updateOrg(orgId, payload);
      setState({ data, loading: false, error: null });
      return null;
    } catch (err) {
      const message = (err as Error).message;
      setState({ data: null, loading: false, error: message });
      return message;
    }
  }

  return { ...state, execute };
}
