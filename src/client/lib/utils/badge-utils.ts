import {
  TICKET_STATUSES,
  TICKET_PRIORITIES,
  QUOTE_APPROVAL_STATUSES,
  type TicketStatus,
  type TicketPriority,
  type QuoteApprovalStatus,
} from '../../../shared/constants/lookup-values.js';

const STATUS_BADGE_CLASS: Record<TicketStatus, string> = {
  [TICKET_STATUSES.OPEN]: 'badge badge-open',
  [TICKET_STATUSES.ASSIGNED]: 'badge badge-assigned',
  [TICKET_STATUSES.IN_PROGRESS]: 'badge badge-in-progress',
  [TICKET_STATUSES.RESOLVED]: 'badge badge-resolved',
  [TICKET_STATUSES.CLOSED]: 'badge badge-closed',
  [TICKET_STATUSES.CANCELLED]: 'badge badge-cancelled',
};

const PRIORITY_BADGE_CLASS: Record<TicketPriority, string> = {
  [TICKET_PRIORITIES.P1]: 'badge badge-p1',
  [TICKET_PRIORITIES.P2]: 'badge badge-p2',
  [TICKET_PRIORITIES.P3]: 'badge badge-p3',
  [TICKET_PRIORITIES.P4]: 'badge badge-p4',
};

const QUOTE_APPROVAL_BADGE_CLASS: Record<QuoteApprovalStatus, string> = {
  [QUOTE_APPROVAL_STATUSES.APPROVED_BY_AGENT]: 'badge badge-quote-pending',
  [QUOTE_APPROVAL_STATUSES.APPROVED_BY_MANAGER]: 'badge badge-quote-pending',
  [QUOTE_APPROVAL_STATUSES.APPROVED_BY_ADMIN]: 'badge badge-quote-pending',
  [QUOTE_APPROVAL_STATUSES.APPROVED_BY_CUSTOMER]: 'badge badge-quote-approved',
  [QUOTE_APPROVAL_STATUSES.REJECTED_BY_MANAGER]: 'badge badge-quote-rejected-manager',
  [QUOTE_APPROVAL_STATUSES.REJECTED_BY_CUSTOMER]: 'badge badge-quote-rejected-customer',
  [QUOTE_APPROVAL_STATUSES.REVISED]: 'badge badge-quote-revised',
};

export function getStatusBadgeClass(status: string): string {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  return STATUS_BADGE_CLASS[status as TicketStatus] ?? 'badge badge-neutral';
}

export function getPriorityBadgeClass(priority: string): string {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  return PRIORITY_BADGE_CLASS[priority as TicketPriority] ?? 'badge badge-neutral';
}

/**
 * Returns the CSS class for the SLA breach badge on ticket cards.
 * Only call this when slaStatus is non-null.
 */
export function getSlaBadgeClass(deadlineBreached: boolean): string {
  return deadlineBreached ? 'badge badge-sla-breached' : 'badge badge-sla-ok';
}

/**
 * Returns the CSS class for the quote approval status badge.
 * Pass null when no quote exists -- renders a "Quote Needed" badge.
 */
export function getQuoteApprovalBadgeClass(status: string | null): string {
  if (status === null) return 'badge badge-quote-needed';
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  return QUOTE_APPROVAL_BADGE_CLASS[status as QuoteApprovalStatus] ?? 'badge badge-neutral';
}
