import { useState } from 'react';
import { orgAPI } from '../../lib/api/org.api.js';
import type { OrgMemberResponse } from '../../../shared/contracts/org-contracts.js';
import type { OrgRoleName } from '../../../shared/constants/lookup-values.js';

interface UseUpdateMemberRoleState {
  data: OrgMemberResponse | null;
  loading: boolean;
  error: string | null;
}

interface UseUpdateMemberRoleReturn extends UseUpdateMemberRoleState {
  execute: (orgId: string, userId: string, role: OrgRoleName) => Promise<string | null>;
}

export function useUpdateMemberRole(): UseUpdateMemberRoleReturn {
  const [state, setState] = useState<UseUpdateMemberRoleState>({
    data: null,
    loading: false,
    error: null,
  });

  async function execute(orgId: string, userId: string, role: OrgRoleName): Promise<string | null> {
    setState({ data: null, loading: true, error: null });
    try {
      const data = await orgAPI.updateMemberRole(orgId, userId, { role });
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
