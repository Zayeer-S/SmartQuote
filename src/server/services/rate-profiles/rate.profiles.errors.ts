export class RateProfileError extends Error {
  public statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = 'RateProfileError';
    this.statusCode = statusCode;
  }
}

export class RateProfileForbiddenError extends Error {
  public statusCode: number;
  constructor(message: string) {
    super(message);
    this.name = 'RateProfileForbiddenError';
    this.statusCode = 403;
  }
}

export const RATE_PROFILE_ERROR_MSGS = {
  NOT_FOUND: 'Rate profile not found',
  FORBIDDEN: 'You do not have permission to perform this action',
  INVALID_DATE_RANGE: 'effective_from must be before effective_to',
  OVERLAP:
    'An active rate profile already exists for this ticket type, severity, and business impact combination within the given date range',
} as const;
