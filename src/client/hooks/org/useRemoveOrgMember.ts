import { useState } from 'react';
import { orgAPI } from '../../lib/api/org.api.js';

interface UseRemoveOrgMemberState {
  loading: boolean;
  error: string | null;
}

interface UseRemoveOrgMemberReturn extends UseRemoveOrgMemberState {
  execute: (orgId: string, userId: string) => Promise<void>;
}

export function useRemoveOrgMember(): UseRemoveOrgMemberReturn {
  const [state, setState] = useState<UseRemoveOrgMemberState>({
    loading: false,
    error: null,
  });

  async function execute(orgId: string, userId: string): Promise<void> {
    setState({ loading: true, error: null });
    try {
      await orgAPI.removeMember(orgId, userId);
      setState({ loading: false, error: null });
    } catch (err) {
      setState({ loading: false, error: (err as Error).message });
    }
  }

  return { ...state, execute };
}
