import {
  QUOTE_APPROVAL_STATUSES,
  QUOTE_EFFORT_LEVELS,
  QUOTE_CONFIDENCE_LEVELS,
} from '../../../../shared/constants/lookup-values.js';
import type {
  QuoteApprovalStatus,
  QuoteEffortLevel,
  QuoteConfidenceLevel,
} from '../../../../shared/constants/lookup-values.js';

// Panel navigation

export type ActiveQuotePanel = 'none' | 'create' | 'update' | 'revisions' | 'reject';

// Form state

export interface CreateQuoteFormState {
  estimatedHoursMinimum: string;
  estimatedHoursMaximum: string;
  hourlyRate: string;
  fixedCost: string;
  quoteEffortLevel: QuoteEffortLevel;
  quoteConfidenceLevel: QuoteConfidenceLevel;
}

export const INITIAL_CREATE_FORM: CreateQuoteFormState = {
  estimatedHoursMinimum: '',
  estimatedHoursMaximum: '',
  hourlyRate: '',
  fixedCost: '0',
  quoteEffortLevel: QUOTE_EFFORT_LEVELS.MEDIUM,
  quoteConfidenceLevel: QUOTE_CONFIDENCE_LEVELS.MEDIUM,
};

export interface UpdateQuoteFormState {
  estimatedHoursMinimum?: string;
  estimatedHoursMaximum?: string;
  hourlyRate?: string;
  fixedCost?: string;
  quoteEffortLevel?: QuoteEffortLevel;
  quoteConfidenceLevel?: QuoteConfidenceLevel;
}

// Select options

export const EFFORT_OPTIONS: { value: QuoteEffortLevel; label: string }[] = [
  { value: QUOTE_EFFORT_LEVELS.LOW, label: QUOTE_EFFORT_LEVELS.LOW },
  { value: QUOTE_EFFORT_LEVELS.MEDIUM, label: QUOTE_EFFORT_LEVELS.MEDIUM },
  { value: QUOTE_EFFORT_LEVELS.HIGH, label: QUOTE_EFFORT_LEVELS.HIGH },
];

export const CONFIDENCE_OPTIONS: { value: QuoteConfidenceLevel; label: string }[] = [
  { value: QUOTE_CONFIDENCE_LEVELS.LOW, label: QUOTE_CONFIDENCE_LEVELS.LOW },
  { value: QUOTE_CONFIDENCE_LEVELS.MEDIUM, label: QUOTE_CONFIDENCE_LEVELS.MEDIUM },
  { value: QUOTE_CONFIDENCE_LEVELS.HIGH, label: QUOTE_CONFIDENCE_LEVELS.HIGH },
];

export const APPROVAL_STATUS_BADGE: Record<QuoteApprovalStatus, string> = {
  [QUOTE_APPROVAL_STATUSES.APPROVED_BY_AGENT]: 'badge badge-in-progress',
  [QUOTE_APPROVAL_STATUSES.APPROVED_BY_MANAGER]: 'badge badge-in-progress',
  [QUOTE_APPROVAL_STATUSES.APPROVED_BY_ADMIN]: 'badge badge-in-progress',
  [QUOTE_APPROVAL_STATUSES.APPROVED_BY_CUSTOMER]: 'badge badge-resolved',
  [QUOTE_APPROVAL_STATUSES.REJECTED_BY_MANAGER]: 'badge badge-cancelled',
  [QUOTE_APPROVAL_STATUSES.REJECTED_BY_CUSTOMER]: 'badge badge-cancelled',
  [QUOTE_APPROVAL_STATUSES.REVISED]: 'badge badge-neutral',
};

/** Quote has no approval record yet, or was rejected -- agent can (re)submit. */
export function isSubmittable(status: QuoteApprovalStatus | null): boolean {
  return (
    status === null ||
    status === QUOTE_APPROVAL_STATUSES.REJECTED_BY_MANAGER ||
    status === QUOTE_APPROVAL_STATUSES.REJECTED_BY_CUSTOMER
  );
}

/** Quote has been submitted by an agent and is awaiting manager or admin action. */
export function isAwaitingManagerApproval(status: QuoteApprovalStatus | null): boolean {
  return status === QUOTE_APPROVAL_STATUSES.APPROVED_BY_AGENT;
}

/** Quote has cleared employee approval and is awaiting the customer's decision. */
export function isAwaitingCustomerAction(status: QuoteApprovalStatus | null): boolean {
  return (
    status === QUOTE_APPROVAL_STATUSES.APPROVED_BY_MANAGER ||
    status === QUOTE_APPROVAL_STATUSES.APPROVED_BY_ADMIN
  );
}

/** Quote fields can be edited. Locked once submitted (APPROVED_BY_AGENT) or fully resolved. */
export function isEditable(status: QuoteApprovalStatus | null): boolean {
  return (
    status === null ||
    status === QUOTE_APPROVAL_STATUSES.REJECTED_BY_MANAGER ||
    status === QUOTE_APPROVAL_STATUSES.REJECTED_BY_CUSTOMER
  );
}

/** Quote has reached a terminal accepted or rejected state -- no further actions possible. */
export function isSettled(status: QuoteApprovalStatus | null): boolean {
  return (
    status === QUOTE_APPROVAL_STATUSES.APPROVED_BY_CUSTOMER ||
    status === QUOTE_APPROVAL_STATUSES.REJECTED_BY_MANAGER ||
    status === QUOTE_APPROVAL_STATUSES.REJECTED_BY_CUSTOMER
  );
}

/** Quote can still be created or replaced (no quote exists, or the last one was rejected). */
export function isCreatable(status: QuoteApprovalStatus | null): boolean {
  return isSubmittable(status);
}
