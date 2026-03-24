import type { GetCurrentUserResponse } from '../../../shared/contracts/auth-contracts';
import type {
  MemberFormValues,
  OrganizationDirectoryState,
  OrganizationFormValues,
  OrganizationMemberRecord,
  OrganizationRecord,
} from './organizationDirectory.types';

const STORAGE_KEY = 'smartquote.organization-directory.v1';

const PRIMARY_ORG_ID = 'org-primary';
const SECONDARY_ORG_ID = 'org-secondary';

const baseOrganizations: OrganizationRecord[] = [
  {
    id: PRIMARY_ORG_ID,
    name: 'Northwind Telecom',
    domain: 'northwind.example',
    contactEmail: 'ops@northwind.example',
    status: 'Active',
    createdAt: new Date('2026-01-10T09:00:00.000Z').toISOString(),
  },
  {
    id: SECONDARY_ORG_ID,
    name: 'Bluepeak Systems',
    domain: 'bluepeak.example',
    contactEmail: 'admin@bluepeak.example',
    status: 'Active',
    createdAt: new Date('2026-02-14T11:00:00.000Z').toISOString(),
  },
];

const baseMembers: OrganizationMemberRecord[] = [
  {
    id: 'member-northwind-1',
    organizationId: PRIMARY_ORG_ID,
    firstName: 'Nina',
    lastName: 'Patel',
    email: 'nina.patel@northwind.example',
    roleTitle: 'Operations Lead',
    status: 'Active',
    createdAt: new Date('2026-01-12T09:00:00.000Z').toISOString(),
  },
  {
    id: 'member-northwind-2',
    organizationId: PRIMARY_ORG_ID,
    firstName: 'Tom',
    lastName: 'Baker',
    email: 'tom.baker@northwind.example',
    roleTitle: 'Service Manager',
    status: 'Invited',
    createdAt: new Date('2026-01-19T09:00:00.000Z').toISOString(),
  },
  {
    id: 'member-bluepeak-1',
    organizationId: SECONDARY_ORG_ID,
    firstName: 'Amira',
    lastName: 'Khan',
    email: 'amira.khan@bluepeak.example',
    roleTitle: 'IT Coordinator',
    status: 'Active',
    createdAt: new Date('2026-02-16T09:00:00.000Z').toISOString(),
  },
];

function createEmptyState(): OrganizationDirectoryState {
  return {
    organizations: [],
    members: [],
  };
}

function readState(): OrganizationDirectoryState {
  if (typeof window === 'undefined') return createEmptyState();

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return createEmptyState();

  try {
    return JSON.parse(raw) as OrganizationDirectoryState;
  } catch {
    return createEmptyState();
  }
}

function writeState(state: OrganizationDirectoryState): OrganizationDirectoryState {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
  return state;
}

function makeUserOrganization(user: GetCurrentUserResponse): OrganizationRecord {
  return {
    id: user.organizationId ?? `org-${user.id}`,
    name: `${user.lastName} Organisation`,
    domain: user.email.split('@')[1] ?? 'organisation.local',
    contactEmail: user.email,
    status: 'Active',
    createdAt: user.createdAt,
  };
}

function makeUserMember(user: GetCurrentUserResponse): OrganizationMemberRecord | null {
  if (!user.organizationId) return null;

  return {
    id: `member-${user.id}`,
    organizationId: user.organizationId,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    roleTitle: user.role.name,
    status: 'Active',
    createdAt: user.createdAt,
  };
}

function buildSeedState(user: GetCurrentUserResponse | null): OrganizationDirectoryState {
  const organizations = [...baseOrganizations];
  const members = [...baseMembers];

  if (user?.organizationId && !organizations.some((org) => org.id === user.organizationId)) {
    organizations.unshift(makeUserOrganization(user));
  }

  const userMember = user ? makeUserMember(user) : null;
  if (userMember && !members.some((member) => member.id === userMember.id)) {
    members.unshift(userMember);
  }

  return {
    organizations,
    members,
  };
}

function sortState(state: OrganizationDirectoryState): OrganizationDirectoryState {
  return {
    organizations: [...state.organizations].sort((a, b) => a.name.localeCompare(b.name)),
    members: [...state.members].sort((a, b) => a.firstName.localeCompare(b.firstName)),
  };
}

export function ensureOrganizationDirectory(
  user: GetCurrentUserResponse | null
): OrganizationDirectoryState {
  const current = readState();
  const shouldSeed = current.organizations.length === 0;

  let next = shouldSeed ? buildSeedState(user) : current;

  if (user?.organizationId && !next.organizations.some((org) => org.id === user.organizationId)) {
    next = {
      ...next,
      organizations: [...next.organizations, makeUserOrganization(user)],
    };
  }

  const userMember = user ? makeUserMember(user) : null;
  if (userMember && !next.members.some((member) => member.id === userMember.id)) {
    next = {
      ...next,
      members: [...next.members, userMember],
    };
  }

  return writeState(sortState(next));
}

export function listOrganizations(user: GetCurrentUserResponse | null): OrganizationRecord[] {
  return ensureOrganizationDirectory(user).organizations;
}

export function listMembers(user: GetCurrentUserResponse | null): OrganizationMemberRecord[] {
  return ensureOrganizationDirectory(user).members;
}

export function createOrganization(
  values: OrganizationFormValues,
  user: GetCurrentUserResponse | null
): OrganizationRecord {
  const state = ensureOrganizationDirectory(user);
  const organization: OrganizationRecord = {
    id: globalThis.crypto.randomUUID(),
    name: values.name.trim(),
    domain: values.domain.trim(),
    contactEmail: values.contactEmail.trim(),
    status: values.status,
    createdAt: new Date().toISOString(),
  };

  writeState(
    sortState({
      ...state,
      organizations: [...state.organizations, organization],
    })
  );

  return organization;
}

export function updateOrganization(
  id: string,
  values: OrganizationFormValues,
  user: GetCurrentUserResponse | null
): void {
  const state = ensureOrganizationDirectory(user);
  writeState(
    sortState({
      ...state,
      organizations: state.organizations.map((organization) =>
        organization.id === id
          ? {
              ...organization,
              name: values.name.trim(),
              domain: values.domain.trim(),
              contactEmail: values.contactEmail.trim(),
              status: values.status,
            }
          : organization
      ),
    })
  );
}

export function deleteOrganization(id: string, user: GetCurrentUserResponse | null): void {
  const state = ensureOrganizationDirectory(user);
  writeState(
    sortState({
      organizations: state.organizations.filter((organization) => organization.id !== id),
      members: state.members.filter((member) => member.organizationId !== id),
    })
  );
}

export function createMember(
  values: MemberFormValues,
  user: GetCurrentUserResponse | null
): OrganizationMemberRecord {
  const state = ensureOrganizationDirectory(user);
  const member: OrganizationMemberRecord = {
    id: globalThis.crypto.randomUUID(),
    organizationId: values.organizationId,
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    email: values.email.trim(),
    roleTitle: values.roleTitle.trim(),
    status: values.status,
    createdAt: new Date().toISOString(),
  };

  writeState(
    sortState({
      ...state,
      members: [...state.members, member],
    })
  );

  return member;
}

export function updateMember(
  id: string,
  values: MemberFormValues,
  user: GetCurrentUserResponse | null
): void {
  const state = ensureOrganizationDirectory(user);
  writeState(
    sortState({
      ...state,
      members: state.members.map((member) =>
        member.id === id
          ? {
              ...member,
              organizationId: values.organizationId,
              firstName: values.firstName.trim(),
              lastName: values.lastName.trim(),
              email: values.email.trim(),
              roleTitle: values.roleTitle.trim(),
              status: values.status,
            }
          : member
      ),
    })
  );
}

export function deleteMember(id: string, user: GetCurrentUserResponse | null): void {
  const state = ensureOrganizationDirectory(user);
  writeState(
    sortState({
      ...state,
      members: state.members.filter((member) => member.id !== id),
    })
  );
}
