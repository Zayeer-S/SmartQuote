/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import type { Knex } from 'knex';
import type { Permission } from '../../database/types/tables';
import type { PermissionId, RoleId } from '../../database/types/ids';
import { LookupTableDAO } from '../base/lookup.table.dao';
import { LOOKUP_TABLES, LINK_TABLES } from '../../database/config/table-names';
import type { QueryOptions } from '../base/types';

export class PermissionsDAO extends LookupTableDAO<Permission, PermissionId> {
  constructor(db: Knex) {
    super(
      {
        tableName: LOOKUP_TABLES.PERMISSIONS,
        primaryKey: 'id',
      },
      db
    );
  }

  /**
   * Find all permissions for a specific role
   *
   * @param roleId Role ID
   * @param options Query options
   * @returns Array of permissions
   */
  async findByRoleId(roleId: RoleId, options?: QueryOptions): Promise<Permission[]> {
    let query = this.getQuery(options);
    query = query
      .select(`${LOOKUP_TABLES.PERMISSIONS}.*`)
      .innerJoin(
        LINK_TABLES.ROLE_PERMISSIONS,
        `${LOOKUP_TABLES.PERMISSIONS}.id`,
        `${LINK_TABLES.ROLE_PERMISSIONS}.permission_id`
      )
      .where(`${LINK_TABLES.ROLE_PERMISSIONS}.role_id`, roleId);

    query = this.applyFilters(query, options);

    const results = await query;
    return results as Permission[];
  }
}
