import { useState } from 'react';
import { orgAPI } from '../../lib/api/org.api.js';
import type { ListOrgMembersResponse } from '../../../shared/contracts/org-contracts.js';

interface UseListOrgMembersState {
  data: ListOrgMembersResponse | null;
  loading: boolean;
  error: string | null;
}

interface UseListOrgMembersReturn extends UseListOrgMembersState {
  execute: (orgId: string) => Promise<void>;
}

export function useListOrgMembers(): UseListOrgMembersReturn {
  const [state, setState] = useState<UseListOrgMembersState>({
    data: null,
    loading: false,
    error: null,
  });

  async function execute(orgId: string): Promise<void> {
    setState({ data: null, loading: true, error: null });
    try {
      const data = await orgAPI.listMembers(orgId);
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState({ data: null, loading: false, error: (err as Error).message });
    }
  }

  return { ...state, execute };
}
