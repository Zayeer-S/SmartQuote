export const ANALYTICS_ERROR_MSGS = {
  FORBIDDEN: 'You do not have permission to access analytics',
} as const;

export class AnalyticsError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode = 500) {
    super(message);
    this.name = 'AnalyticsError';
    this.statusCode = statusCode;
  }
}

export class AnalyticsForbiddenError extends AnalyticsError {
  constructor(message = ANALYTICS_ERROR_MSGS.FORBIDDEN) {
    super(message, 403);
    this.name = 'ForbiddenError';
  }
}
