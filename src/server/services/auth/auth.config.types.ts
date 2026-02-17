export interface AuthRateLimitConfig {
  login: {
    /** Time window for rate limiting in milliseconds */
    windowMs: number;
    /** Maximum login attempts per window */
    maxAttempts: number;
  };
  api: {
    windowMs: number;
    maxAttempts: number;
  }
}

export interface AuthConfig {
  /** Session expiry time in hours */
  expiryHours: number;
  /** Secret for signing session tokens */
  secret: string;
  /** How often to clean up expired sessions (in minutes) */
  cleanupIntervalMinutes: number;
  /** Session token length in bytes (before base64 encoding) */
  tokenBytes: number
}

export interface PasswordConfig {
  /** Bcrypt salt rounds for password hashing */
  saltRounds: number;

  /** Minimum password length */
  minLength: number;

  /** Maximum password length */
  maxLength: number;

  /** Require at least one special character */
  requireSpecialChar: boolean;

  /** Require at least one number */
  requireNumber: boolean;

  /** Require at least one uppercase letter */
  requireUppercase: boolean;

  /** Require at least one lowercase letter */
  requireLowercase: boolean;

  /** Length of generated passwords for admin-created users */
  generatedPasswordLength: number;
}
