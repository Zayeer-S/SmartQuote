import { useState } from 'react';
import { adminAPI } from '../lib/api/admin.api';
import { ALL_ROLES } from '../../shared/constants';
import { UserListItem } from '../../shared/contracts/user-contracts';

interface UseListAdminUsersState {
  data: UserListItem[] | null;
  loading: boolean;
  error: string | null;
}

interface UseListAdminUsersReturn extends UseListAdminUsersState {
  execute: () => Promise<void>;
}

export function useListEmployeeUsers(): UseListAdminUsersReturn {
  const [state, setState] = useState<UseListAdminUsersState>({
    data: null,
    loading: false,
    error: null,
  });

  async function execute(): Promise<void> {
    setState({ data: null, loading: true, error: null });
    try {
      const response = await adminAPI.listUsers();
      // Filter to admin-role users only so customers never appear in the assignee list.
      // Role name comparison avoids hardcoding a DB integer ID.
      const admins = response.users.filter((u) => u.role.name !== ALL_ROLES[0]);
      setState({ data: admins, loading: false, error: null });
    } catch (err) {
      setState({ data: null, loading: false, error: (err as Error).message });
    }
  }

  return { ...state, execute };
}
