import path from 'path';

export const SESSION_PATHS = {
  CUSTOMER: path.resolve('.playwright/customer.json'),
  ADMIN: path.resolve('.playwright/admin.json'),
} as const;

export const SMOKE_DATA_PATHS = {
  COMMENT_TICKET: path.resolve('.playwright/comment-smoke-ticket.json'),
} as const;
