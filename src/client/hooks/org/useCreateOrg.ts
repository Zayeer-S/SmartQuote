import { useState } from 'react';
import { orgAPI } from '../../lib/api/org.api.js';
import type { CreateOrgRequest, OrgResponse } from '../../../shared/contracts/org-contracts.js';

interface UseCreateOrgState {
  data: OrgResponse | null;
  loading: boolean;
  error: string | null;
}

interface UseCreateOrgReturn extends UseCreateOrgState {
  execute: (payload: CreateOrgRequest) => Promise<string | null>;
}

export function useCreateOrg(): UseCreateOrgReturn {
  const [state, setState] = useState<UseCreateOrgState>({
    data: null,
    loading: false,
    error: null,
  });

  async function execute(payload: CreateOrgRequest): Promise<string | null> {
    setState({ data: null, loading: true, error: null });
    try {
      const data = await orgAPI.createOrg(payload);
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
