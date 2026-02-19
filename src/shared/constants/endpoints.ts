export const AUTH_ENDPOINTS = {
  BASE: '/auth',
  LOGIN: '/login',
  LOGOUT: '/logout',
  ME: '/me',
  CHANGE_PASSWORD: '/change-password',
  PERMISSIONS: '/permissions',
} as const;

export const ADMIN_ENDPOINTS = {
  BASE: '/admin',
  USERS: '/users',
} as const;

export const TICKET_ENDPOINTS = {
  BASE: '/tickets',
  LIST: '/',
  CREATE: '/',
  GET: (ticketId = ':ticketId') => `/${ticketId}`,
  UPDATE: (ticketId = ':ticketId') => `/${ticketId}`,
  DELETE: (ticketId = ':ticketId') => `/${ticketId}`,
  ASSIGN: (ticketId = ':ticketId') => `/${ticketId}/assign`,
  RESOLVE: (ticketId = ':ticketId') => `/${ticketId}/resolve`,
  LIST_COMMENTS: (ticketId = ':ticketId') => `/${ticketId}/comments`,
  ADD_COMMENT: (ticketId = ':ticketId') => `/${ticketId}/comments`,
} as const;

export const QUOTE_ENDPOINTS = {
  BASE: (ticketId = ':ticketId') => `/${ticketId}/quotes`,
  LIST: (ticketId = ':ticketId') => `/${ticketId}/quotes`,
  GENERATE: (ticketId = ':ticketId') => `/${ticketId}/quotes/auto`,
  CREATE_MANUAL: (ticketId = ':ticketId') => `/${ticketId}/quotes/manual`,
  GET: (ticketId = ':ticketId', quoteId = ':quoteId') => `/${ticketId}/quotes/${quoteId}`,
  UPDATE: (ticketId = ':ticketId', quoteId = ':quoteId') => `/${ticketId}/quotes/${quoteId}`,
  SUBMIT: (ticketId = ':ticketId', quoteId = ':quoteId') => `/${ticketId}/quotes/${quoteId}/submit`,
  APPROVE: (ticketId = ':ticketId', quoteId = ':quoteId') =>
    `/${ticketId}/quotes/${quoteId}/approve`,
  REJECT: (ticketId = ':ticketId', quoteId = ':quoteId') => `/${ticketId}/quotes/${quoteId}/reject`,
  REVISIONS: (ticketId = ':ticketId', quoteId = ':quoteId') =>
    `/${ticketId}/quotes/${quoteId}/revisions`,
} as const;
