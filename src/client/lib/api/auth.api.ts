import type {
  ChangePasswordRequest,
  ChangePasswordResponse,
  GetCurrentUserPermissionsResponse,
  GetCurrentUserResponse,
  LoginRequest,
  LoginResponse,
  LogoutResponse,
} from '../../../shared/contracts/auth-contracts';
import { extractData, httpClient, type ApiResponse } from './http-client';

export const authAPI = {
  /**
   * Login user and create session
   * @param credentials Email and password
   * @returns Login response with user data and token
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await httpClient.post<ApiResponse<LoginResponse>>('/auth/login', credentials);
    return extractData(response);
  },

  /**
   * Logout user and invalidate session
   * @returns Logout confirmation message
   */
  async logout(): Promise<LogoutResponse> {
    const response = await httpClient.post<ApiResponse<LogoutResponse>>('/auth/logout');
    return extractData(response);
  },

  /**
   * Get current authenticated user
   * @returns Current user data
   */
  async getCurrentUser(): Promise<GetCurrentUserResponse> {
    const response = await httpClient.get<ApiResponse<GetCurrentUserResponse>>('/auth/me');
    return extractData(response);
  },

  /**
   * Change user password
   * @param passwords Old and new password
   * @returns Success message
   */
  async changePassword(passwords: ChangePasswordRequest): Promise<ChangePasswordResponse> {
    const response = await httpClient.post<ApiResponse<ChangePasswordResponse>>(
      '/auth/change-password',
      passwords
    );
    return extractData(response);
  },

  async getPermissions(): Promise<GetCurrentUserPermissionsResponse> {
    const response =
      await httpClient.post<ApiResponse<GetCurrentUserPermissionsResponse>>('/auth/permissions');
    return extractData(response);
  },
};
