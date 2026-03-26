import type { Knex } from 'knex';
import type { Session } from '../../database/types/tables.js';
import type { SessionId, UserId } from '../../database/types/ids.js';
import { BaseDAO } from '../base/base.dao.js';
import { LINK_TABLES } from '../../database/config/table-names.js';
import type { QueryOptions } from '../base/types.js';

export class SessionsDAO extends BaseDAO<Session, SessionId> {
  constructor(db: Knex) {
    super(
      {
        tableName: LINK_TABLES.SESSIONS,
        primaryKey: 'id',
      },
      db
    );
  }

  /**
   * Find a session by its token
   *
   * @param token Session token to search for
   * @param options Query options
   * @returns Session or null if not found
   */
  async findByToken(token: string, options?: QueryOptions): Promise<Session | null> {
    let query = this.getQuery(options);
    query = query.where({ session_token: token });
    query = this.applyFilters(query, options);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const result = await query.first();
    return result ? (result as Session) : null;
  }

  /**
   * Delete a session by its token (hard delete)
   *
   * @param sessionToken The session token to delete
   * @param options Query options
   * @returns True if session was deleted
   */
  async deleteToken(sessionToken: string, options?: QueryOptions): Promise<boolean> {
    const query = this.getQuery(options);
    const count = await query.where('session_token', sessionToken).del();
    return count > 0;
  }

  /**
   * Delete all expired sessions (for TODO cron cleanup job)
   *
   * @param options Query options
   * @returns Number of sessions deleted
   */
  async deleteExpired(options?: QueryOptions): Promise<number> {
    const query = this.getQuery(options);
    return await query.where('expires_at', '<', new Date()).delete();
  }

  /**
   * Delete all sessions for a specific user (for logout all / password change)
   *
   * @param userId User ID
   * @param options Query options
   * @returns Number of sessions deleted
   */
  async deleteAllForUser(userId: UserId, options?: QueryOptions): Promise<number> {
    const query = this.getQuery(options);
    return await query.where({ user_id: userId }).delete();
  }
}
