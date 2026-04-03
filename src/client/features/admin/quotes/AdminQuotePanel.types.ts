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

// ─── Panel navigation ─────────────────────────────────────────────────────────

export type ActiveQuotePanel = 'none' | 'create' | 'update' | 'revisions' | 'reject';

// ─── Form state ───────────────────────────────────────────────────────────────

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

// ─── Select options ───────────────────────────────────────────────────────────

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

// ─── Badge map ────────────────────────────────────────────────────────────────

export const APPROVAL_STATUS_BADGE: Record<QuoteApprovalStatus, string> = {
  [QUOTE_APPROVAL_STATUSES.PENDING]: 'badge badge-in-progress',
  [QUOTE_APPROVAL_STATUSES.APPROVED]: 'badge badge-resolved',
  [QUOTE_APPROVAL_STATUSES.REJECTED]: 'badge badge-cancelled',
  [QUOTE_APPROVAL_STATUSES.REVISED]: 'badge badge-neutral',
};

// ─── Derived status helpers ───────────────────────────────────────────────────

export function isSubmittable(status: QuoteApprovalStatus | null): boolean {
  return status === null || status === QUOTE_APPROVAL_STATUSES.REJECTED;
}

export function isPending(status: QuoteApprovalStatus | null): boolean {
  return status === QUOTE_APPROVAL_STATUSES.PENDING;
}

export function isEditable(status: QuoteApprovalStatus | null): boolean {
  return status !== QUOTE_APPROVAL_STATUSES.PENDING;
}
