export class OrgError extends Error {
  public statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = 'OrgError';
    this.statusCode = statusCode;
  }
}

export class OrgForbiddenError extends Error {
  public statusCode: number;
  constructor(message: string) {
    super(message);
    this.name = 'OrgForbiddenError';
    this.statusCode = 403;
  }
}

export const ORG_ERROR_MSGS = {
  NOT_FOUND: 'Organization not found',
  FORBIDDEN: 'You do not have permission to perform this action',
  ALREADY_EXISTS: 'An organization with this name already exists',
  INACTIVE: 'Organization is inactive',
} as const;

export const ORG_MEMBERS_ERROR_MSGS = {
  TARGET_NOT_FOUND: 'Target user not found',
  TARGET_NOT_CUSTOMER: 'Only customer accounts can be added as org members',
  ALREADY_MEMBER_THIS_ORG: 'User is already a member of this organization',
  ALREADY_MEMBER_OTHER_ORG: 'Customer already belongs to another organization',
  NOT_A_MEMBER: 'User is not a member of this organization',
  SELF_DEMOTION_FORBIDDEN: 'You cannot demote yourself from Manager',
  ROLE_ALREADY_ASSIGNED: 'Member already has this org role',
} as const;
