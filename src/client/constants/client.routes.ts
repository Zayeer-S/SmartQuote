export const CLIENT_ROUTES = {
  LOGIN: '/login',
  CANT_ACCESS_ACCOUNT: '/cannot',
  CUSTOMER: {
    ROOT: '/customer',
    TICKET: (id = ':ticketId') => `/customer/tickets/${id}`,
    ORG_MEMBERS: `/customer/org/members`,
    SETTINGS: '/customer/settings',
  },
  ADMIN: {
    ROOT: '/admin',
    TICKETS: '/admin/tickets',
    TICKET: (id = ':ticketId') => `/admin/tickets/${id}`,
    ORGANIZATIONS_LIST: '/admin/organizations',
    ORGANIZATIONS: (orgId = ':orgId') => `/admin/organizations/${orgId}`,
    ORGANIZATION_MEMBERS: (orgId = ':orgId') => `/admin/organizations/${orgId}/members`,
    ANALYTICS: '/admin/analytics',
    SLA_POLICIES: '/admin/sla-policies',
    RATE_PROFILES: '/admin/rate-profiles',
    USER_MANAGEMENT: '/admin/user-management',
    SYSTEM_CONFIG: '/admin/system-config',
    SETTINGS: '/admin/settings',
  },
} as const;
