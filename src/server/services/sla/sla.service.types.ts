import type { SlaContract } from '../../../shared/contracts/sla-contracts.js';
import type { OrganizationId, UserId } from '../../database/types/ids.js';

export interface CreateSlaPolicyData {
  name: string;
  userId: UserId | null;
  organizationId: OrganizationId | null;
  contract: SlaContract;
  effectiveFrom: Date;
  effectiveTo: Date;
}

export interface UpdateSlaPolicyData {
  name?: string;
  contract?: SlaContract;
  effectiveFrom?: Date;
  effectiveTo?: Date;
  isActive?: boolean;
}
