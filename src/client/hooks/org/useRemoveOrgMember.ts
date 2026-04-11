import { useState } from 'react';
import { orgAPI } from '../../lib/api/org.api.js';

interface UseRemoveOrgMemberState {
  loading: boolean;
  error: string | null;
}

interface UseRemoveOrgMemberReturn extends UseRemoveOrgMemberState {
  execute: (orgId: string, userId: string) => Promise<string | null>;
}

export function useRemoveOrgMember(): UseRemoveOrgMemberReturn {
  const [state, setState] = useState<UseRemoveOrgMemberState>({
    loading: false,
    error: null,
  });

  async function execute(orgId: string, userId: string): Promise<string | null> {
    setState({ loading: true, error: null });
    try {
      await orgAPI.removeMember(orgId, userId);
      setState({ loading: false, error: null });
      return null;
    } catch (err) {
      const message = (err as Error).message;
      setState({ loading: false, error: message });
      return message;
    }
  }

  return { ...state, execute };
}
