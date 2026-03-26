import { useCallback, useState } from 'react';
import type { GetCurrentUserResponse } from '../../shared/contracts/auth-contracts';
import {
  createMember,
  createOrganization,
  deleteMember,
  deleteOrganization,
  ensureOrganizationDirectory,
  updateMember,
  updateOrganization,
} from '../features/organizationDirectory/organizationDirectory.storage';
import type {
  MemberFormValues,
  OrganizationDirectoryState,
  OrganizationFormValues,
} from '../features/organizationDirectory/organizationDirectory.types';

export function useOrganizationDirectory(user: GetCurrentUserResponse | null) {
  const [state, setState] = useState<OrganizationDirectoryState>(() =>
    ensureOrganizationDirectory(user)
  );

  const refresh = useCallback(() => {
    setState(ensureOrganizationDirectory(user));
  }, [user]);

  const createOrganizationRecord = useCallback(
    (values: OrganizationFormValues) => {
      createOrganization(values, user);
      refresh();
    },
    [refresh, user]
  );

  const updateOrganizationRecord = useCallback(
    (id: string, values: OrganizationFormValues) => {
      updateOrganization(id, values, user);
      refresh();
    },
    [refresh, user]
  );

  const deleteOrganizationRecord = useCallback(
    (id: string) => {
      deleteOrganization(id, user);
      refresh();
    },
    [refresh, user]
  );

  const createMemberRecord = useCallback(
    (values: MemberFormValues) => {
      createMember(values, user);
      refresh();
    },
    [refresh, user]
  );

  const updateMemberRecord = useCallback(
    (id: string, values: MemberFormValues) => {
      updateMember(id, values, user);
      refresh();
    },
    [refresh, user]
  );

  const deleteMemberRecord = useCallback(
    (id: string) => {
      deleteMember(id, user);
      refresh();
    },
    [refresh, user]
  );

  return {
    organizations: state.organizations,
    members: state.members,
    refresh,
    createOrganization: createOrganizationRecord,
    updateOrganization: updateOrganizationRecord,
    deleteOrganization: deleteOrganizationRecord,
    createMember: createMemberRecord,
    updateMember: updateMemberRecord,
    deleteMember: deleteMemberRecord,
  };
}
