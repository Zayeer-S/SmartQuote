import type {
  CreateUserRequest,
  CreateUserResponse,
  ListUsersResponse,
} from '../../../shared/contracts/user-contracts.js';
import { extractData, httpClient, type ApiResponse } from './http-client.js';

export const adminAPI = {
  /**
   * Create a new user
   * @param userData User creation data
   * @returns Created user data
   */
  async createUser(userData: CreateUserRequest): Promise<CreateUserResponse> {
    const response = await httpClient.post<ApiResponse<CreateUserResponse>>(
      '/admin/users',
      userData
    );
    return extractData(response);
  },

  /**
   * List all users with optional filters
   * @param params Query parameters
   * @returns Paginated list of users
   */
  async listUsers(params?: {
    limit?: number;
    offset?: number;
    roleId?: number;
    organizationId?: string;
  }): Promise<ListUsersResponse> {
    const response = await httpClient.get<ApiResponse<ListUsersResponse>>('/admin/users', {
      params,
    });
    return extractData(response);
  },
};
