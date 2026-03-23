import type {
  AddOrgMemberRequest,
  CreateOrgRequest,
  ListOrgMembersResponse,
  ListOrgsResponse,
  OrgMemberResponse,
  OrgResponse,
  UpdateOrgRequest,
} from '../../../shared/contracts/org-contracts.js';
import { ORG_ENDPOINTS } from '../../../shared/constants/endpoints.js';
import { extractData, httpClient, type ApiResponse } from './http-client.js';

const base = ORG_ENDPOINTS.BASE;

export const orgAPI = {
  async createOrg(data: CreateOrgRequest): Promise<OrgResponse> {
    const response = await httpClient.post<ApiResponse<OrgResponse>>(
      base + ORG_ENDPOINTS.CREATE,
      data
    );
    return extractData(response);
  },

  async listOrgs(): Promise<ListOrgsResponse> {
    const response = await httpClient.get<ApiResponse<ListOrgsResponse>>(base + ORG_ENDPOINTS.LIST);
    return extractData(response);
  },

  async getOrg(orgId: string): Promise<OrgResponse> {
    const response = await httpClient.get<ApiResponse<OrgResponse>>(
      base + ORG_ENDPOINTS.GET(orgId)
    );
    return extractData(response);
  },

  async updateOrg(orgId: string, data: UpdateOrgRequest): Promise<OrgResponse> {
    const response = await httpClient.patch<ApiResponse<OrgResponse>>(
      base + ORG_ENDPOINTS.UPDATE(orgId),
      data
    );
    return extractData(response);
  },

  async deleteOrg(orgId: string): Promise<void> {
    await httpClient.delete(base + ORG_ENDPOINTS.DELETE(orgId));
  },

  async getMyOrg(): Promise<OrgResponse | null> {
    const response = await httpClient.get<ApiResponse<OrgResponse | null>>(
      base + ORG_ENDPOINTS.MY_ORG
    );
    return extractData(response);
  },

  async listMembers(orgId: string): Promise<ListOrgMembersResponse> {
    const response = await httpClient.get<ApiResponse<ListOrgMembersResponse>>(
      base + ORG_ENDPOINTS.LIST_MEMBERS(orgId)
    );
    return extractData(response);
  },

  async addMember(orgId: string, data: AddOrgMemberRequest): Promise<OrgMemberResponse> {
    const response = await httpClient.post<ApiResponse<OrgMemberResponse>>(
      base + ORG_ENDPOINTS.ADD_MEMBER(orgId),
      data
    );
    return extractData(response);
  },

  async removeMember(orgId: string, userId: string): Promise<void> {
    await httpClient.delete(base + ORG_ENDPOINTS.REMOVE_MEMBER(orgId, userId));
  },
};
