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
  userId: string;
}

export interface ListOrgsResponse {
  organizations: OrgResponse[];
}

export interface ListOrgMembersResponse {
  members: OrgMemberResponse[];
}
