import type { OrganizationId, UserId } from '../../database/types/ids.js';

export interface AddMemberData {
  targetUserId: UserId;
  orgId: OrganizationId;
}

export interface RemoveMemberData {
  targetUserId: UserId;
  orgId: OrganizationId;
}
