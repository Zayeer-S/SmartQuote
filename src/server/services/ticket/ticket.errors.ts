export class TicketError extends Error {
  public statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = 'TicketError';
    this.statusCode = statusCode;
  }
}

export const TICKET_ERROR_MSGS = {
  NOT_FOUND: 'Ticket not found',
  FORBIDDEN: 'You do not have permission to access this ticket',
  CANNOT_UPDATE: 'Ticket cannot be updated in its current status',
  CANNOT_DELETE: 'Ticket cannot be deleted in its current status',
  ASSIGNEE_NOT_FOUND: 'Assignee user not found',
} as const;

export class ForbiddenError extends Error {
  public statusCode: number;
  constructor(message: string) {
    super(message);
    this.name = 'ForbiddenError';
    this.statusCode = 403;
  }
}
