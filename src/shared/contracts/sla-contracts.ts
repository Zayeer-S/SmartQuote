import type { TicketSeverity } from '../constants/lookup-values.js';

/** One row in the per-severity target matrix stored in sla_policies.contract */
export interface SlaSeverityTarget {
  severity: TicketSeverity;
  /** Hours to first response */
  responseTimeHours: number;
  /** Hours to resolution */
  resolutionTimeHours: number;
}

/** The typed shape of the sla_policies.contract jsonb column */
export interface SlaContract {
  severityTargets: SlaSeverityTarget[];
}

/**
 * SLA status computed for a specific ticket.
 * Breach is deadline-driven -- deadlineBreached = ticket.deadline < now.
 * severityTarget is the contract row matching the ticket's severity, or null
 * if the active policy has no entry for that severity.
 */
export interface SlaStatusResponse {
  policyName: string;
  severityTarget: {
    responseTimeHours: number;
    resolutionTimeHours: number;
  } | null;
  /** All severity targets from the policy, shown in full on the detail view */
  allSeverityTargets: SlaSeverityTarget[];
  /** True when ticket.deadline is in the past */
  deadlineBreached: boolean;
  /** Hours between now and the deadline. Negative when already breached. */
  hoursUntilDeadline: number;
}

export interface CreateSlaPolicyRequest {
  name: string;
  /** Provide one of userId or organizationId -- never both */
  userId?: string;
  organizationId?: string;
  contract: SlaContract;
  effectiveFrom: string; // ISO 8601
  effectiveTo: string; // ISO 8601
}

export interface UpdateSlaPolicyRequest {
  name?: string;
  contract?: SlaContract;
  effectiveFrom?: string;
  effectiveTo?: string;
  isActive?: boolean;
}

export interface SlaPolicyResponse {
  id: number;
  name: string;
  organizationId: string | null;
  userId: string | null;
  /**
   * Human-readable label for the scope target.
   * Org-scoped:  the organization name
   * User-scoped: the user's full name + email, e.g. "Jane Smith (jane@example.com)"
   */
  scopeDisplayName: string;
  contract: SlaContract;
  effectiveFrom: string;
  effectiveTo: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ListSlaPoliciesResponse {
  policies: SlaPolicyResponse[];
}
