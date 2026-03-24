export type OrganizationStatus = 'Active' | 'Inactive';
export type OrganizationMemberStatus = 'Active' | 'Invited' | 'Inactive';

export interface OrganizationRecord {
  id: string;
  name: string;
  domain: string;
  contactEmail: string;
  status: OrganizationStatus;
  createdAt: string;
}

export interface OrganizationMemberRecord {
  id: string;
  organizationId: string;
  firstName: string;
  lastName: string;
  email: string;
  roleTitle: string;
  status: OrganizationMemberStatus;
  createdAt: string;
}

export interface OrganizationDirectoryState {
  organizations: OrganizationRecord[];
  members: OrganizationMemberRecord[];
}

export interface OrganizationFormValues {
  name: string;
  domain: string;
  contactEmail: string;
  status: OrganizationStatus;
}

export interface MemberFormValues {
  organizationId: string;
  firstName: string;
  lastName: string;
  email: string;
  roleTitle: string;
  status: OrganizationMemberStatus;
}
