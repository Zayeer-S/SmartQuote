export const AUTH_ENDPOINTS = {
  LOGIN: '/login',
  LOGOUT: '/logout',
  ME: '/me',
  CHANGE_PASSWORD: '/change-password',
};

export const ADMIN_ENDPOINTS = {
  USERS: '/users',
};

export const TICKET_ENDPOINTS = {
  LIST: '/',
  CREATE: '/',
  GET: (ticketId = ':ticketId') => `/${ticketId}`,
  UPDATE: (ticketId = ':ticketId') => `/${ticketId}`,
  DELETE: (ticketId = ':ticketId') => `/${ticketId}`,
  ASSIGN: (ticketId = ':ticketId') => `/${ticketId}/assign`,
  RESOLVE: (ticketId = ':ticketId') => `/${ticketId}/resolve`,
  LIST_COMMENTS: (ticketId = ':ticketId') => `/${ticketId}/comments`,
  ADD_COMMENT: (ticketId = ':ticketId') => `/${ticketId}/comments`,
};
