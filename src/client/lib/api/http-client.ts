import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import { tokenStorage } from '../storage/tokenStorage';

export const httpClient: AxiosInstance = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

httpClient.interceptors.request.use((config) => {
  const token = tokenStorage.get();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

httpClient.interceptors.response.use(
  (response) => response,
  (err: unknown) => {
    if (axios.isAxiosError(err)) {
      const apiError = (err.response?.data as ApiResponse<unknown>).error;
      if (apiError) {
        return Promise.reject(new Error(apiError));
      }
    }
    // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
    return Promise.reject(err);
  }
);

/** Helper type for API responses. Matches respond.ts from backend */
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
