import { useState, useCallback } from 'react';
import { AUTH_ROLES } from '../../../shared/constants/lookup-values.js';
import type { OrgResponse } from '../../../shared/contracts/org-contracts.js';
import type { UserListItem } from '../../../shared/contracts/user-contracts.js';
import { orgAPI } from '../../lib/api/org.api.js';
import { adminAPI } from '../../lib/api/admin.api.js';

interface UseSlaScopeOptionsState {
  orgs: OrgResponse[];
  customerUsers: UserListItem[];
  loading: boolean;
  error: string | null;
}

interface UseSlaScopeOptionsReturn extends UseSlaScopeOptionsState {
  fetch: () => Promise<void>;
}

/**
 * Fetches organizations and unorg'd customer users in parallel for use
 * in the SLA policy create form scope dropdowns.
 */
export function useSlaScopeOptions(): UseSlaScopeOptionsReturn {
  const [state, setState] = useState<UseSlaScopeOptionsState>({
    orgs: [],
    customerUsers: [],
    loading: false,
    error: null,
  });

  const fetch = useCallback(async (): Promise<void> => {
    setState({ orgs: [], customerUsers: [], loading: true, error: null });
    try {
      const [orgsRes, usersRes] = await Promise.all([
        orgAPI.listOrgs(),
        adminAPI.listUsers({ limit: 500 }),
      ]);

      setState({
        orgs: orgsRes.organizations,
        customerUsers: usersRes.users.filter((u) => u.role.name === AUTH_ROLES.CUSTOMER),
        loading: false,
        error: null,
      });
    } catch (err) {
      setState({
        orgs: [],
        customerUsers: [],
        loading: false,
        error: (err as Error).message,
      });
    }
  }, []);

  return { ...state, fetch };
}
