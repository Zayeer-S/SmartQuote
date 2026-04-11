// TODO ADD ORGANIZATION_ID
export const ROLE_IDS = {
  CUSTOMER: 1,
  AGENT: 2,
  MANAGER: 3,
  ADMIN: 4,
} as const;

export type roleId = (typeof ROLE_IDS)[keyof typeof ROLE_IDS];

export const USERS: Record<string, { EMAIL: string; PASSWORD: string; ROLE_ID: roleId }> = {
  CUSTOMER1_DIFF_ORG: { EMAIL: 'c1@demo.com', PASSWORD: 'password', ROLE_ID: ROLE_IDS.CUSTOMER },
  CUSTOMER2_SAME_ORG: { EMAIL: 'c2@demo.com', PASSWORD: 'password', ROLE_ID: ROLE_IDS.CUSTOMER },
  CUSTOMER3_SAME_ORG: { EMAIL: 'c3@demo.com', PASSWORD: 'password', ROLE_ID: ROLE_IDS.CUSTOMER },
  CUSTOMER4_NO_ORG: { EMAIL: 'c4@demo.com', PASSWORD: 'password', ROLE_ID: ROLE_IDS.CUSTOMER },
  AGENT: { EMAIL: 'agent@giacom.com', PASSWORD: 'password', ROLE_ID: ROLE_IDS.AGENT },
  MANAGER: { EMAIL: 'manager@giacom.com', PASSWORD: 'password', ROLE_ID: ROLE_IDS.MANAGER },
  ADMIN: { EMAIL: 'admin@giacom.com', PASSWORD: 'password', ROLE_ID: ROLE_IDS.ADMIN },
} as const;
