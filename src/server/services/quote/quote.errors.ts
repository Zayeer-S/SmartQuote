export class QuoteError extends Error {
  public statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = 'QuoteError';
    this.statusCode = statusCode;
  }
}

export const QUOTE_ERROR_MSGS = {
  NOT_FOUND: 'Quote not found',
  FORBIDDEN: 'You do not have permission to access this quote',
  NO_ACTIVE_RATE_PROFILE: 'No active rate profile found matching this ticket',
  NO_MATCHING_RULE: 'No calculation rule found matching this ticket',
  ALREADY_APPROVED: 'Quote has already been approved',
  NOT_SUBMITTED: 'Quote has not been submitted for approval yet',
  WRONG_STAGE: 'This action is not permitted at the current approval stage',
  MIN_MAX_HOURS: 'Estimated maximum hours must be greater than or equal to minimum hours',
  USER_NOT_FOUND: 'No user found for this quote',
} as const;
