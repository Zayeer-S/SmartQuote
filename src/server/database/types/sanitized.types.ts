export interface AnalyticsResolutionTimeRow {
  ticketId: string;
  createdAt: Date;
  resolvedAt: Date;
  resolutionTimeHours: number;
  ticketSeverity: string;
  businessImpact: string;
}

export interface AnalyticsVolumeRow {
  day: string;
  count: number;
}

export interface AnalyticsQuoteAccuracyRow {
  quoteId: string;
  ticketId: string;
  estimatedCost: number;
  finalCost: number;
  variance: number;
  accuracyPercentage: number;
  createdAt: Date;
}
