export class AuthError extends Error {
  public statusCode: number;
  constructor(message: string, statusCode = 401) {
    super(message);
    this.name = 'AuthError';
    this.statusCode = statusCode;
  }
}

export class PasswordValidationError extends Error {
  public statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = statusCode;
  }
}

export const AUTH_ERROR_MSGS = {
  INVALID_CREDS: 'Invalid email or password',
  ROLE_NOT_FOUND: 'User role not found',
  USER_NOT_FOUND: 'User not found',
  INVALID_SESSION: 'Invalid session',
};
