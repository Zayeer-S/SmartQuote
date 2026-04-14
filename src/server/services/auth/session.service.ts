import crypto from 'crypto';
import type { TransactionContext } from '../../daos/base/types.js';
import type { UserId } from '../../database/types/ids.js';
import type { Session } from '../../database/types/tables.js';
import type { AuthConfig } from './auth.config.types.js';
import type { SessionsDAO } from '../../daos/children/sessions.dao.js';

export class SessionService {
  private readonly config: AuthConfig;
  private sessionsDAO: SessionsDAO;

  constructor(config: AuthConfig, sessionsDAO: SessionsDAO) {
    this.config = config;
    this.sessionsDAO = sessionsDAO;
  }

  /**
   * Create a new session for a user
   * Generates a cryptographically secure random token
   *
   * @param userId User ID to create session for
   * @param options Optional transaction context
   * @returns Created session
   */
  async create(userId: UserId, options?: TransactionContext): Promise<Session> {
    const tokenBytes = crypto.randomBytes(this.config.tokenBytes);
    const token = tokenBytes.toString('base64url');

    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.config.expiryHours * 60 * 60 * 1000);

    const session = await this.sessionsDAO.create(
      {
        user_id: userId,
        session_token: token,
        last_activity: now,
        expires_at: expiresAt,
      },
      options
    );

    return session;
  }

  /**
   * Validate a session token
   * Checks if session exists and is not expired
   *
   * @param token Session token to validate
   * @param options Optional transaction context
   * @returns Session if valid, null if invalid or expired
   */
  async validate(token: string, options?: TransactionContext): Promise<Session | null> {
    const session = await this.sessionsDAO.findByToken(token, options);
    if (!session) return null;

    const now = new Date();
    if (session.expires_at < now) {
      await this.sessionsDAO.deleteToken(session.session_token, options);
      return null;
    }

    await this.sessionsDAO.update({ id: session.id }, { last_activity: now }, options);
    return session;
  }

  /**
   * Invalidate a session (logout)
   *
   * @param token - Session token to invalidate
   * @param options - Optional transaction context
   * @returns True if session was invalidated, false if not found
   */
  async invalidate(token: string, options?: TransactionContext): Promise<boolean> {
    const session = await this.sessionsDAO.findByToken(token, options);
    if (!session) return false;

    await this.sessionsDAO.deleteToken(session.session_token, options);
    return true;
  }

  /**
   * Invalidate all sessions for a user (logout everywhere / password change)
   *
   * @param userId User ID
   * @param options Optional transaction context
   * @returns Number of sessions invalidated
   */
  async invalidateAllForUser(userId: UserId, options?: TransactionContext): Promise<number> {
    return await this.sessionsDAO.deleteAllForUser(userId, options);
  }

  /**
   * Clean up expired sessions (for TODO cron job)
   *
   * @param options - Optional transaction context
   * @returns Number of sessions deleted
   */
  async cleanupExpired(options?: TransactionContext): Promise<number> {
    return await this.sessionsDAO.deleteExpired(options);
  }
}
