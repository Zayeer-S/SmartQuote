import { useState } from 'react';
import { orgAPI } from '../../lib/api/org.api.js';
import type { OrgMemberResponse } from '../../../shared/contracts/org-contracts.js';

interface UseAddOrgMemberState {
  data: OrgMemberResponse | null;
  loading: boolean;
  error: string | null;
}

interface UseAddOrgMemberReturn extends UseAddOrgMemberState {
  execute: (orgId: string, email: string) => Promise<string | null>;
}

export function useAddOrgMember(): UseAddOrgMemberReturn {
  const [state, setState] = useState<UseAddOrgMemberState>({
    data: null,
    loading: false,
    error: null,
  });

  async function execute(orgId: string, email: string): Promise<string | null> {
    setState({ data: null, loading: true, error: null });
    try {
      const data = await orgAPI.addMember(orgId, { email });
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
