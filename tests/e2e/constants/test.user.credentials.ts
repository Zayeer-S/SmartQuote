// TODO MOVE AND ADD ORGANIZATION_ID

export const USERS: Record<string, { EMAIL: string; PASSWORD: string }> = {
  CUSTOMER1: { EMAIL: 'customer1@demo.com', PASSWORD: 'password' },
  CUSTOMER2: { EMAIL: 'customer2@demo.com', PASSWORD: 'password' },
  AGENT: { EMAIL: 'agent@giacom.com', PASSWORD: 'password' },
  MANAGER: { EMAIL: 'manager@giacom.com', PASSWORD: 'password' },
  ADMIN: { EMAIL: 'admin@giacom.com', PASSWORD: 'password' },
} as const;
