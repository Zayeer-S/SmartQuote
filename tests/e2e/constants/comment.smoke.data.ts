import fs from 'fs';
import { SMOKE_DATA_PATHS } from './e2e.paths';

function loadCommentSmokeTicket(): { ticketId: string } {
  const raw = fs.readFileSync(SMOKE_DATA_PATHS.COMMENT_TICKET, 'utf-8');
  return JSON.parse(raw) as { ticketId: string };
}

export function getCommentSmokeTicketId(): string {
  return loadCommentSmokeTicket().ticketId;
}

// Admin views the ticket on the admin route, customer on the customer route.
export const COMMENT_SMOKE_URLS = {
  admin: (id: string) => `/admin/tickets/${id}`,
  customer: (id: string) => `/customer/tickets/${id}`,
} as const;

export const COMMENT_CONTENT = {
  EXTERNAL: 'Smoke test external comment',
  INTERNAL: 'Smoke test internal comment - should not be visible to customer',
} as const;
