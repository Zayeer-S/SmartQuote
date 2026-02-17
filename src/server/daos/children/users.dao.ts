/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import type { Knex } from 'knex';
import type { User } from '../../database/types/tables';
import type { UserId, RoleId } from '../../database/types/ids';
import { DeletableDAO } from '../base/deletable.dao';
import { MAIN_TABLES, LOOKUP_TABLES } from '../../database/config/table-names';
import type { QueryOptions } from '../base/types';

export class UsersDAO extends DeletableDAO<User, UserId> {
  constructor(db: Knex) {
    super(
      {
        tableName: MAIN_TABLES.USERS,
        primaryKey: 'id',
      },
      db
    );
  }

  /**
   * Find a user by email address
   *
   * @param email Email address to search for
   * @param options Query options
   * @returns User or null if not found
   */
  async findByEmail(email: string, options?: QueryOptions): Promise<User | null> {
    let query = this.getQuery(options);
    query = query.where({ email });
    query = this.applyFilters(query, options);

    const result = await query.first();
    return result ? (result as User) : null;
  }

  /**
   * Find a user with their role information joined
   *
   * @param userId User ID
   * @param options Query options
   * @returns User with role data or null
   */
  async findWithRole(
    userId: UserId,
    options?: QueryOptions
  ): Promise<(User & { role: { id: RoleId; name: string } }) | null> {
    let query = this.getQuery(options);
    query = query
      .select(
        `${MAIN_TABLES.USERS}.*`,
        `${LOOKUP_TABLES.ROLES}.id as role_id`,
        `${LOOKUP_TABLES.ROLES}.name as role_name`
      )
      .leftJoin(LOOKUP_TABLES.ROLES, `${MAIN_TABLES.USERS}.role_id`, `${LOOKUP_TABLES.ROLES}.id`)
      .where(`${MAIN_TABLES.USERS}.id`, userId);

    query = this.applyFilters(query, options);

    const result = await query.first();

    if (!result) return null;

    const { role_id, role_name, ...userData } = result;

    return {
      ...(userData as User),
      role: {
        id: role_id as RoleId,
        name: role_name as string,
      },
    };
  }
}
