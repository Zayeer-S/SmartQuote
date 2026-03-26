import type {
  ChangePasswordRequest,
  ChangePasswordResponse,
  GetCurrentUserPermissionsResponse,
  GetCurrentUserResponse,
  LoginRequest,
  LoginResponse,
  LogoutResponse,
} from '../../../shared/contracts/auth-contracts.js';
import { AUTH_ENDPOINTS } from '../../../shared/constants/endpoints.js';
import { extractData, httpClient, type ApiResponse } from './http-client.js';

const base = AUTH_ENDPOINTS.BASE;

export const authAPI = {
  /**
   * Login user and create session
   * @param credentials Email and password
   * @returns Login response with user data and token
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await httpClient.post<ApiResponse<LoginResponse>>(
      base + AUTH_ENDPOINTS.LOGIN,
      credentials
    );
    return extractData(response);
  },

  /**
   * Logout user and invalidate session
   * @returns Logout confirmation message
   */
  async logout(): Promise<LogoutResponse> {
    const response = await httpClient.post<ApiResponse<LogoutResponse>>(
      base + AUTH_ENDPOINTS.LOGOUT
    );
    return extractData(response);
  },

  /**
   * Get current authenticated user
   * @returns Current user data
   */
  async getCurrentUser(): Promise<GetCurrentUserResponse> {
    const response = await httpClient.get<ApiResponse<GetCurrentUserResponse>>(
      base + AUTH_ENDPOINTS.ME
    );
    return extractData(response);
  },

  /**
   * Change user password
   * @param passwords Old and new password
   * @returns Success message
   */
  async changePassword(passwords: ChangePasswordRequest): Promise<ChangePasswordResponse> {
    const response = await httpClient.post<ApiResponse<ChangePasswordResponse>>(
      base + AUTH_ENDPOINTS.CHANGE_PASSWORD,
      passwords
    );
    return extractData(response);
  },

  /**
   * Get permissions for the current authenticated user
   * @returns List of permission names
   */
  async getPermissions(): Promise<GetCurrentUserPermissionsResponse> {
    const response = await httpClient.get<ApiResponse<GetCurrentUserPermissionsResponse>>(
      base + AUTH_ENDPOINTS.PERMISSIONS
    );
    return extractData(response);
  },
};
