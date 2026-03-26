import { BaseDAO } from './base.dao.js';
import type {
  ActivatableEntity,
  ActivationMethods,
  PrimaryKey,
  TableConfig,
  UpdateOptions,
  Where,
} from './types.js';
import type { Knex } from 'knex';

export abstract class ActivatableDAO<
  T extends ActivatableEntity<ID>,
  ID extends PrimaryKey = PrimaryKey,
>
  extends BaseDAO<T, ID>
  implements ActivationMethods<T, ID>
{
  constructor(config: TableConfig, db: Knex) {
    super({ ...config, hasActivation: true }, db);
  }

  /**
   * Activate an entity by setting is_active to true
   *
   * @param id Primary key value
   * @param options Optional transaction context
   * @returns Activated entity or null if not found
   */
  async activate(id: ID, options?: UpdateOptions): Promise<T | null> {
    const updated = await this.update(
      { [this.primaryKey]: id } as Where<T>,
      { is_active: true } as Partial<Omit<T, 'id' | 'created_at' | 'updated_at'>>,
      options
    );

    if (!updated) return null;

    return await this.getById(id, { ...options, includeInactive: true });
  }

  /**
   * Deactivate an entity by setting is_active to false
   *
   * @param id - Primary key value
   * @param options - Optional transaction context
   * @returns Deactivated entity or null if not found
   */
  async deactivate(id: ID, options?: UpdateOptions): Promise<T | null> {
    const updated = await this.update(
      { [this.primaryKey]: id } as Where<T>,
      { is_active: false } as Partial<Omit<T, 'id' | 'created_at' | 'updated_at'>>,
      options
    );

    if (!updated) return null;

    return await this.getById(id, { ...options, includeInactive: true });
  }
}
