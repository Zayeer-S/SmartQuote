import type { OrganizationId, UserId } from '../../database/types/ids.js';
import type { OrgRoleName } from '../../../shared/constants/index.js';

export interface AddMemberData {
  targetEmail: string;
  orgId: OrganizationId;
}

export interface RemoveMemberData {
  targetUserId: UserId;
  orgId: OrganizationId;
}

export interface UpdateMemberRoleData {
  targetUserId: UserId;
  orgId: OrganizationId;
  newRole: OrgRoleName;
}
