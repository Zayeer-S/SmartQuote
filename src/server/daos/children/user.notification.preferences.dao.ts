import type { Knex } from 'knex';
import type { UserNotificationPreference } from '../../database/types/tables';
import type { NotificationTypeId, UserId } from '../../database/types/ids';
import { CompositeKeyDAO } from '../base/composite.key.dao';
import { LINK_TABLES } from '../../database/config/table-names';
import type { QueryOptions } from '../base/types';

/**
 * DAO for user notification preferences
 *
 * This is a link table with composite primary key (user_id, notification_type_id)
 * It tracks which notification types a user has opted into
 */
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

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
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
