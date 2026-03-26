export interface AnalyticsDateRangeRequest {
  /** ISO 8601 date string (inclusive) */
  from: string;
  /** ISO 8601 date string (inclusive) */
  to: string;
}

export interface ResolutionTimeDataPoint {
  ticketId: string;
  createdAt: string;
  resolvedAt: string;
  resolutionTimeHours: number;
  ticketSeverity: string;
  businessImpact: string;
}

export interface ResolutionTimeResponse {
  data: ResolutionTimeDataPoint[];
  averageHours: number;
}

export interface TicketVolumeDataPoint {
  /** YYYY-MM-DD */
  day: string;
  count: number;
}

export interface TicketVolumeResponse {
  data: TicketVolumeDataPoint[];
}

export interface QuoteAccuracyDataPoint {
  quoteId: string;
  ticketId: string;
  estimatedCost: number;
  finalCost: number;
  variance: number;
  accuracyPercentage: number;
  createdAt: string;
}

export interface QuoteAccuracyResponse {
  data: QuoteAccuracyDataPoint[];
  averageAccuracyPercentage: number;
}
