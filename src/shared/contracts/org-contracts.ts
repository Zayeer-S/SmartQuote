export interface OrgResponse {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OrgMemberResponse {
  organizationId: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  orgRoleId: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrgRequest {
  name: string;
}

export interface UpdateOrgRequest {
  name?: string;
  isActive?: boolean;
}

export interface AddOrgMemberRequest {
  email: string;
}

export interface ListOrgsResponse {
  organizations: OrgResponse[];
}

export interface ListOrgMembersResponse {
  members: OrgMemberResponse[];
}
