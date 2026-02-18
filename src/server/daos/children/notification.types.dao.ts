import type { Knex } from 'knex';
import type { NotificationType } from '../../database/types/tables';
import type { NotificationTypeId } from '../../database/types/ids';
import { LookupTableDAO } from '../base/lookup.table.dao';
import { LOOKUP_TABLES } from '../../database/config/table-names';

export class NotificationTypesDAO extends LookupTableDAO<NotificationType, NotificationTypeId> {
  constructor(db: Knex) {
    super(
      {
        tableName: LOOKUP_TABLES.NOTIFICATION_TYPES,
        primaryKey: 'id',
      },
      db
    );
  }
}
