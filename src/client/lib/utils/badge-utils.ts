import {
  TICKET_STATUSES,
  TICKET_PRIORITIES,
  type TicketStatus,
  type TicketPriority,
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

export function getStatusBadgeClass(status: string): string {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  return STATUS_BADGE_CLASS[status as TicketStatus] ?? 'badge badge-neutral';
}

export function getPriorityBadgeClass(priority: string): string {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  return PRIORITY_BADGE_CLASS[priority as TicketPriority] ?? 'badge badge-neutral';
}
