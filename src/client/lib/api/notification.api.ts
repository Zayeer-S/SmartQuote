import type {
  GetNotificationPreferencesResponse,
  UpdateNotificationPreferencesRequest,
  UpdateNotificationPreferencesResponse,
} from '../../../shared/contracts/notification-contracts.js';
import { USER_ENDPOINTS } from '../../../shared/constants/endpoints.js';
import { extractData, httpClient, type ApiResponse } from './http-client.js';

const base = USER_ENDPOINTS.BASE;

export const notificationAPI = {
  async getMyPreferences(): Promise<GetNotificationPreferencesResponse> {
    const response = await httpClient.get<ApiResponse<GetNotificationPreferencesResponse>>(
      base + USER_ENDPOINTS.MY_NOTIFICATION_PREFERENCES
    );
    return extractData(response);
  },

  async updateMyPreferences(
    body: UpdateNotificationPreferencesRequest
  ): Promise<UpdateNotificationPreferencesResponse> {
    const response = await httpClient.put<ApiResponse<UpdateNotificationPreferencesResponse>>(
      base + USER_ENDPOINTS.MY_NOTIFICATION_PREFERENCES,
      body
    );
    return extractData(response);
  },
};
