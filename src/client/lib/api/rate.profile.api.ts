import type {
  CreateRateProfileRequest,
  ListRateProfilesResponse,
  RateProfileResponse,
  UpdateRateProfileRequest,
} from '../../../shared/contracts/rate-profile-contracts.js';
import { RATE_PROFILE_ENDPOINTS } from '../../../shared/constants/endpoints.js';
import { extractData, httpClient, type ApiResponse } from './http-client.js';

const base = RATE_PROFILE_ENDPOINTS.BASE;

export const rateProfileAPI = {
  async listRateProfiles(): Promise<ListRateProfilesResponse> {
    const response = await httpClient.get<ApiResponse<ListRateProfilesResponse>>(
      base + RATE_PROFILE_ENDPOINTS.LIST
    );
    return extractData(response);
  },

  async getRateProfile(rateProfileId: number): Promise<RateProfileResponse> {
    const response = await httpClient.get<ApiResponse<RateProfileResponse>>(
      base + RATE_PROFILE_ENDPOINTS.GET(String(rateProfileId))
    );
    return extractData(response);
  },

  async createRateProfile(data: CreateRateProfileRequest): Promise<RateProfileResponse> {
    const response = await httpClient.post<ApiResponse<RateProfileResponse>>(
      base + RATE_PROFILE_ENDPOINTS.CREATE,
      data
    );
    return extractData(response);
  },

  async updateRateProfile(
    rateProfileId: number,
    data: UpdateRateProfileRequest
  ): Promise<RateProfileResponse> {
    const response = await httpClient.patch<ApiResponse<RateProfileResponse>>(
      base + RATE_PROFILE_ENDPOINTS.UPDATE(String(rateProfileId)),
      data
    );
    return extractData(response);
  },

  async deleteRateProfile(rateProfileId: number): Promise<void> {
    await httpClient.delete(base + RATE_PROFILE_ENDPOINTS.DELETE(String(rateProfileId)));
  },
};
