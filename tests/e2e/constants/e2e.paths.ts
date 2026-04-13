import path from 'path';

export const SESSION_PATHS = {
  CUSTOMER: path.resolve('.playwright/customer.json'),
  ADMIN: path.resolve('.playwright/admin.json'),
  AGENT: path.resolve('.playwright/agent.json'),
  MANAGER: path.resolve('.playwright/manager.json'),
} as const;

export const SMOKE_DATA_PATHS = {
  COMMENT_TICKET: path.resolve('.playwright/comment-smoke-ticket.json'),
} as const;

export const FLOW_DATA_PATHS = {
  QUOTE_APPROVAL_TICKET: path.resolve('.playwright/quote-approval-flow-ticket.json'),
} as const;
