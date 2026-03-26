import type {
  CreateSlaPolicyRequest,
  ListSlaPoliciesResponse,
  SlaPolicyResponse,
  UpdateSlaPolicyRequest,
} from '../../../shared/contracts/sla-contracts.js';
import { SLA_ENDPOINTS } from '../../../shared/constants/endpoints.js';
import { extractData, httpClient, type ApiResponse } from './http-client.js';

const base = SLA_ENDPOINTS.BASE;

export const slaAPI = {
  async listPolicies(): Promise<ListSlaPoliciesResponse> {
    const response = await httpClient.get<ApiResponse<ListSlaPoliciesResponse>>(
      base + SLA_ENDPOINTS.LIST
    );
    return extractData(response);
  },

  async getPolicy(slaPolicyId: number): Promise<SlaPolicyResponse> {
    const response = await httpClient.get<ApiResponse<SlaPolicyResponse>>(
      base + SLA_ENDPOINTS.GET(String(slaPolicyId))
    );
    return extractData(response);
  },

  async createPolicy(data: CreateSlaPolicyRequest): Promise<SlaPolicyResponse> {
    const response = await httpClient.post<ApiResponse<SlaPolicyResponse>>(
      base + SLA_ENDPOINTS.CREATE,
      data
    );
    return extractData(response);
  },

  async updatePolicy(
    slaPolicyId: number,
    data: UpdateSlaPolicyRequest
  ): Promise<SlaPolicyResponse> {
    const response = await httpClient.patch<ApiResponse<SlaPolicyResponse>>(
      base + SLA_ENDPOINTS.UPDATE(String(slaPolicyId)),
      data
    );
    return extractData(response);
  },

  async deletePolicy(slaPolicyId: number): Promise<void> {
    await httpClient.delete(base + SLA_ENDPOINTS.DELETE(String(slaPolicyId)));
  },
};
