import { BaseDAO } from './base.dao';
import type {
  DeleteOptions,
  PrimaryKey,
  SoftDeletableEntity,
  SoftDeleteMethods,
  TableConfig,
  UpdateOptions,
  Where,
} from './types';
import type { Knex } from 'knex';

export abstract class DeletableDAO<
  T extends SoftDeletableEntity<ID>,
  ID extends PrimaryKey = PrimaryKey,
>
  extends BaseDAO<T, ID>
  implements SoftDeleteMethods<T, ID>
{
  constructor(config: TableConfig, db: Knex) {
    super({ ...config, hasSoftDelete: true }, db);
  }

  /**
   * Soft delete an entity by setting deleted_at
   *
   * @param id Primary key value
   * @param options Optional transaction context
   * @returns True if entity was soft deleted
   */
  async delete(id: ID, options?: DeleteOptions): Promise<boolean> {
    return await this.update(
      { [this.primaryKey]: id } as Where<T>,
      { deleted_at: new Date() } as Partial<Omit<T, 'id' | 'created_at' | 'updated_at'>>,
      options
    );
  }

  /**
   * Soft delete multiple entities by setting deleted_at
   *
   * @param criteria Partial entity to match
   * @param options Optional transaction context
   * @returns Number of entities soft deleted
   */
  async deleteMany(criteria: Partial<T>, options?: DeleteOptions): Promise<boolean> {
    return await this.update(
      criteria,
      { deleted_at: new Date() } as Partial<Omit<T, 'id' | 'created_at' | 'updated_at'>>,
      options
    );
  }

  /**
   * Restore a soft deleted entity by clearing deleted_at
   *
   * @param id Primary key value
   * @param options Optional transaction context
   * @returns Restored entity or null if not found
   */
  async restore(id: ID, options?: UpdateOptions): Promise<T | null> {
    const updated = await this.update(
      { [this.primaryKey]: id } as Where<T>,
      { deleted_at: null } as Partial<Omit<T, 'id' | 'created_at' | 'updated_at'>>,
      options
    );

    if (!updated) return null;

    return await this.getById(id, { ...options, includeDeleted: true });
  }

  /**
   * Restore multiple soft deleted entities
   *
   * @param criteria Partial entity to match
   * @param options Optional transaction context
   * @returns Number of entities restored
   */
  async restoreMany(criteria: Partial<T>, options?: UpdateOptions): Promise<number> {
    return await this.updateMany(
      criteria,
      { deleted_at: null } as Partial<Omit<T, 'id' | 'created_at' | 'updated_at'>>,
      options
    );
  }
}
