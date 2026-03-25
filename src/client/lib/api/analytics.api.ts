// src/client/lib/api/analytics.api.ts

import type {
  QuoteAccuracyResponse,
  ResolutionTimeResponse,
  TicketVolumeResponse,
} from '../../../shared/contracts/analytics-contract.js';
import { ANALYTICS_ENDPOINTS } from '../../../shared/constants/endpoints.js';
import { extractData, httpClient, type ApiResponse } from './http-client.js';

const base = ANALYTICS_ENDPOINTS.BASE;

export const analyticsAPI = {
  /**
   * Fetch average resolution time data for a date range
   * @param from ISO 8601 date string (YYYY-MM-DD)
   * @param to ISO 8601 date string (YYYY-MM-DD)
   */
  async getResolutionTime(from: string, to: string): Promise<ResolutionTimeResponse> {
    const response = await httpClient.get<ApiResponse<ResolutionTimeResponse>>(
      base + ANALYTICS_ENDPOINTS.RESOLUTION_TIME,
      { params: { from, to } }
    );
    return extractData(response);
  },

  /**
   * Fetch ticket volume over time for a date range
   * @param from ISO 8601 date string (YYYY-MM-DD)
   * @param to ISO 8601 date string (YYYY-MM-DD)
   */
  async getTicketVolume(from: string, to: string): Promise<TicketVolumeResponse> {
    const response = await httpClient.get<ApiResponse<TicketVolumeResponse>>(
      base + ANALYTICS_ENDPOINTS.TICKET_VOLUME,
      { params: { from, to } }
    );
    return extractData(response);
  },

  /**
   * Fetch quote accuracy data for a date range
   * @param from ISO 8601 date string (YYYY-MM-DD)
   * @param to ISO 8601 date string (YYYY-MM-DD)
   */
  async getQuoteAccuracy(from: string, to: string): Promise<QuoteAccuracyResponse> {
    const response = await httpClient.get<ApiResponse<QuoteAccuracyResponse>>(
      base + ANALYTICS_ENDPOINTS.QUOTE_ACCURACY,
      { params: { from, to } }
    );
    return extractData(response);
  },
};
