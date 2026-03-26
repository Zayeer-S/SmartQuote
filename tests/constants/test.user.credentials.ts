// TODO ADD ORGANIZATION_ID

export const USERS: Record<string, { EMAIL: string; PASSWORD: string }> = {
  CUSTOMER1_DIFF_ORG: { EMAIL: 'c1@demo.com', PASSWORD: 'password' },
  CUSTOMER2_SAME_ORG: { EMAIL: 'c2@demo.com', PASSWORD: 'password' },
  CUSTOMER3_SAME_ORG: { EMAIL: 'c3@demo.com', PASSWORD: 'password' },
  CUSTOMER4_NO_ORG: { EMAIL: 'c4@demo.com', PASSWORD: 'password' },
  AGENT: { EMAIL: 'agent@giacom.com', PASSWORD: 'password' },
  MANAGER: { EMAIL: 'manager@giacom.com', PASSWORD: 'password' },
  ADMIN: { EMAIL: 'admin@giacom.com', PASSWORD: 'password' },
} as const;
