/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { Knex } from 'knex';
import { DeletableDAO } from '../base/deletable.dao';
import { User, UserNotificationPreference } from '../../database/types/tables';
import { NotificationTypeId, RoleId, UserId } from '../../database/types/ids';
import { LINK_TABLES, LOOKUP_TABLES, MAIN_TABLES } from '../../database/config/table-names';
import { QueryOptions } from '../base/types';
import { CompositeKeyDAO } from '../base/composite.key.dao';

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

export class UserNotificationPreferencesDAO extends CompositeKeyDAO<UserNotificationPreference> {
  constructor(db: Knex) {
    super(
      {
        tableName: LINK_TABLES.USER_NOTIFICATION_PREFERENCES,
        compositeKeys: ['user_id', 'notification_type_id'],
      },
      db
    );
  }

  /**
   * Get all notification preferences for a user
   *
   * @param userId User ID
   * @param options Query options
   * @returns Array of user's notification preferences
   */
  async findByUserId(
    userId: UserId,
    options?: QueryOptions
  ): Promise<UserNotificationPreference[]> {
    return await this.getMany({ user_id: userId } as Partial<UserNotificationPreference>, options);
  }

  /**
   * Check if user has opted in to a specific notification type
   *
   * @param userId User ID
   * @param notificationTypeId Notification type ID
   * @param options Query options
   * @returns True if user has preference set (opted in), false otherwise
   */
  async hasPreference(
    userId: UserId,
    notificationTypeId: NotificationTypeId,
    options?: QueryOptions
  ): Promise<boolean> {
    return await this.exists(
      {
        user_id: userId,
        notification_type_id: notificationTypeId,
      } as Partial<UserNotificationPreference>,
      options
    );
  }

  /**
   * Set notification preference for user (opt in)
   *
   * @param userId User ID
   * @param notificationTypeId Notification type ID
   * @param options Query options
   * @returns Created preference
   */
  async setPreference(
    userId: UserId,
    notificationTypeId: NotificationTypeId,
    options?: QueryOptions
  ): Promise<UserNotificationPreference> {
    const query = this.getQuery(options);

    const [result] = await query
      .insert({
        user_id: userId,
        notification_type_id: notificationTypeId,
      })
      .onConflict(['user_id', 'notification_type_id'])
      .ignore()
      .returning('*');

    return result as UserNotificationPreference;
  }

  /**
   * Remove notification preference for user (opt out)
   *
   * @param userId User ID
   * @param notificationTypeId Notification type ID
   * @param options Query options
   * @returns True if preference was removed
   */
  async removePreference(
    userId: UserId,
    notificationTypeId: NotificationTypeId,
    options?: QueryOptions
  ): Promise<boolean> {
    return await this.delete(
      {
        user_id: userId,
        notification_type_id: notificationTypeId,
      } as Partial<UserNotificationPreference>,
      options
    );
  }

  /**
   * Set multiple notification preferences for a user
   * Replaces all existing preferences with new ones
   *
   * @param userId User ID
   * @param notificationTypeIds Array of notification type IDs to enable
   * @param options Query options
   * @returns Array of created preferences
   */
  async setPreferences(
    userId: UserId,
    notificationTypeIds: NotificationTypeId[],
    options?: QueryOptions
  ): Promise<UserNotificationPreference[]> {
    const trx = options?.trx ?? (await this.db.transaction());

    try {
      // Delete all existing preferences for user
      await trx(this.tableName).where('user_id', userId).delete();

      // Insert new preferences
      if (notificationTypeIds.length > 0) {
        const preferences = notificationTypeIds.map((typeId) => ({
          user_id: userId,
          notification_type_id: typeId,
        }));

        await trx(this.tableName).insert(preferences);
      }

      // Get updated preferences
      const results = await trx(this.tableName).where('user_id', userId);

      if (!options?.trx) {
        await trx.commit();
      }

      return results as UserNotificationPreference[];
    } catch (error) {
      if (!options?.trx) {
        await trx.rollback();
      }
      throw error;
    }
  }

  /**
   * Get notification type IDs that user has enabled
   *
   * @param userId User ID
   * @param options Query options
   * @returns Array of notification type IDs
   */
  async getEnabledNotificationTypes(
    userId: UserId,
    options?: QueryOptions
  ): Promise<NotificationTypeId[]> {
    const preferences = await this.findByUserId(userId, options);
    return preferences.map((p) => p.notification_type_id);
  }
}
