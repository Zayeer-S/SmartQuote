export class SlaError extends Error {
  public statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = 'SlaError';
    this.statusCode = statusCode;
  }
}

export class SlaForbiddenError extends Error {
  public statusCode: number;
  constructor(message: string) {
    super(message);
    this.name = 'SlaForbiddenError';
    this.statusCode = 403;
  }
}

export const SLA_ERROR_MSGS = {
  NOT_FOUND: 'SLA policy not found',
  FORBIDDEN: 'You do not have permission to perform this action',
  TARGET_USER_NOT_FOUND: 'Target user not found',
  TARGET_USER_NOT_CUSTOMER: 'User-scoped SLA policies may only be assigned to Customer accounts',
  TARGET_USER_HAS_ORG:
    'User-scoped SLA policies may only be assigned to customers who are not members of an organization',
  EFFECTIVE_DATE_CONFLICT: 'effectiveTo must be on or after effectiveFrom',
} as const;
