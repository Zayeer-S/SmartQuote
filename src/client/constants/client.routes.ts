export const CLIENT_ROUTES = {
  LOGIN: '/login',
  CANT_ACCESS_ACCOUNT: '/cannot',
  ADMIN: '/admin',
  CUSTOMER: {
    ROOT: '/customer',
    TICKETS: '/customer/tickets',
    TICKET: (id = ':ticketId') => `/customer/tickets/${id}`,
    NEW_TICKET: '/customer/tickets/new',
  },
} as const;
