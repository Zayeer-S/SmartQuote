export const CLIENT_ROUTES = {
  LOGIN: '/login',
  CANT_ACCESS_ACCOUNT: '/cannot',
  CUSTOMER: {
    ROOT: '/customer',
    TICKETS: '/customer/tickets',
    TICKET: (id = ':ticketId') => `/customer/tickets/${id}`,
    NEW_TICKET: '/customer/tickets/new',
    ORG_MEMBERS: `/customer/org/members`,
    SETTINGS: '/customer/settings',
  },
  ADMIN: {
    ROOT: '/admin',
    TICKETS: '/admin/tickets',
    TICKET: (id = ':ticketId') => `/admin/tickets/${id}`,
    QUOTES: '/admin/quotes',
    QUOTE: (ticketId = ':ticketId', quoteId = ':quoteId') =>
      `/admin/tickets/${ticketId}/quotes/${quoteId}`,
    // ORGANIZATIONS: (orgId = `:orgId`) => `/admin/org/${orgId}`,
    // ORGANIZATION_MEMBERS: (orgId = ':orgId') => `/admin/org/${orgId}/members`,
    ORGANIZATIONS: '/admin/org',
    ORGANIZATION_MEMBERS: '/admin/org/members',
    ANALYTICS: '/admin/analytics',
    SLA_POLICIES: '/admin/sla-policies',
    SETTINGS: '/admin/settings',
  },
} as const;
