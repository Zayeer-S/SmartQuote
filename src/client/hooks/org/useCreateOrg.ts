import { useState } from 'react';
import { orgAPI } from '../../lib/api/org.api.js';
import type { CreateOrgRequest, OrgResponse } from '../../../shared/contracts/org-contracts.js';

interface UseCreateOrgState {
  data: OrgResponse | null;
  loading: boolean;
  error: string | null;
}

interface UseCreateOrgReturn extends UseCreateOrgState {
  execute: (payload: CreateOrgRequest) => Promise<void>;
}

export function useCreateOrg(): UseCreateOrgReturn {
  const [state, setState] = useState<UseCreateOrgState>({
    data: null,
    loading: false,
    error: null,
  });

  async function execute(payload: CreateOrgRequest): Promise<void> {
    setState({ data: null, loading: true, error: null });
    try {
      const data = await orgAPI.createOrg(payload);
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState({ data: null, loading: false, error: (err as Error).message });
    }
  }

  return { ...state, execute };
}
