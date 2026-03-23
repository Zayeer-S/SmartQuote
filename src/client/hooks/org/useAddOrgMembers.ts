import { useState } from 'react';
import { orgAPI } from '../../lib/api/org.api.js';
import type { OrgMemberResponse } from '../../../shared/contracts/org-contracts.js';

interface UseAddOrgMemberState {
  data: OrgMemberResponse | null;
  loading: boolean;
  error: string | null;
}

interface UseAddOrgMemberReturn extends UseAddOrgMemberState {
  execute: (orgId: string, userId: string) => Promise<void>;
}

export function useAddOrgMember(): UseAddOrgMemberReturn {
  const [state, setState] = useState<UseAddOrgMemberState>({
    data: null,
    loading: false,
    error: null,
  });

  async function execute(orgId: string, userId: string): Promise<void> {
    setState({ data: null, loading: true, error: null });
    try {
      const data = await orgAPI.addMember(orgId, { userId });
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState({ data: null, loading: false, error: (err as Error).message });
    }
  }

  return { ...state, execute };
}
