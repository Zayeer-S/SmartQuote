import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import { frontEnv } from '../../config/env.frontend';

export const httpClient: AxiosInstance = axios.create({
  baseURL: frontEnv.VITE_APP_URL + '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

/** Helper type for API responses. Matches respond.ts from backend*/
export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

/** Helper to extract data from API response */
export function extractData<T>(response: AxiosResponse<ApiResponse<T>>): T {
  if (!response.data.success || response.data.data === null) {
    throw new Error(response.data.error ?? 'Unknown error');
  }
  return response.data.data;
}
