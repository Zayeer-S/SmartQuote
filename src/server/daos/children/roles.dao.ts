import type { Knex } from 'knex';
import type { Role } from '../../database/types/tables';
import type { RoleId } from '../../database/types/ids';
import { LookupTableDAO } from '../base/lookup.table.dao';
import { LOOKUP_TABLES } from '../../database/config/table-names';

export class RolesDAO extends LookupTableDAO<Role, RoleId> {
  constructor(db: Knex) {
    super(
      {
        tableName: LOOKUP_TABLES.ROLES,
        primaryKey: 'id',
      },
      db
    );
  }
}
