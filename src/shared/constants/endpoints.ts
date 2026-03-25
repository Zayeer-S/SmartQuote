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

export const ORG_ENDPOINTS = {
  BASE: '/orgs',
  LIST: '/',
  CREATE: '/',
  GET: (orgId = ':orgId') => `/${orgId}`,
  UPDATE: (orgId = ':orgId') => `/${orgId}`,
  DELETE: (orgId = ':orgId') => `/${orgId}`,
  MY_ORG: '/me',
  LIST_MEMBERS: (orgId = ':orgId') => `/${orgId}/members`,
  ADD_MEMBER: (orgId = ':orgId') => `/${orgId}/members`,
  REMOVE_MEMBER: (orgId = ':orgId', userId = ':userId') => `/${orgId}/members/${userId}`,
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

export const RATE_PROFILE_ENDPOINTS = {
  BASE: '/rate-profiles',
  LIST: '/',
  CREATE: '/',
  GET: (rateProfileId = ':rateProfileId') => `/${rateProfileId}`,
  UPDATE: (rateProfileId = ':rateProfileId') => `/${rateProfileId}`,
  DELETE: (rateProfileId = ':rateProfileId') => `/${rateProfileId}`,
} as const;

export const ANALYTICS_ENDPOINTS = {
  BASE: '/analytics',
  RESOLUTION_TIME: '/resolution-time',
  TICKET_VOLUME: '/ticket-volume',
  QUOTE_ACCURACY: '/quote-accuracy',
} as const;
