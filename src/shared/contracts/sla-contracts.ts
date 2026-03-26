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
  userId: string | null;
  organizationId: string | null;
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
