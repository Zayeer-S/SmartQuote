import type { Knex } from 'knex';
import type {
  CompositeKeyEntity,
  CreateOptions,
  GetManyOptions,
  ICompositeKeyDAO,
  InsertData,
  QueryOptions,
  CompositeKeyTableConfig,
  UpdateOptions,
  DeleteOptions,
} from './types';

export abstract class CompositeKeyDAO<T extends CompositeKeyEntity> implements ICompositeKeyDAO<T> {
  protected db: Knex;
  protected tableName: string;
  protected compositeKeys: string[];
  private hasSoftDelete: boolean;
  private hasActivation: boolean;

  constructor(config: CompositeKeyTableConfig, db: Knex) {
    this.tableName = config.tableName;
    this.compositeKeys = config.compositeKeys;
    this.db = db;

    this.hasSoftDelete = config.hasSoftDelete ?? false;
    this.hasActivation = config.hasActivation ?? false;
  }

  /** Get a query builder for this table. Uses transaction if provided in options. */
  protected getQuery(options?: QueryOptions): Knex.QueryBuilder {
    return options?.trx ? options.trx(this.tableName) : this.db(this.tableName);
  }

  /** Apply soft delete and activation filters to a query */
  protected applyFilters<Q extends Knex.QueryBuilder>(query: Q, options?: QueryOptions): Q {
    if (this.hasSoftDelete && !options?.includeDeleted)
      query.whereNull(`${this.tableName}.deleted_at`);

    if (this.hasActivation && !options?.includeInactive)
      query.where(`${this.tableName}.is_active`, true);

    return query;
  }

  /**
   * Create a single entity
   *
   * @param data Entity data (without auto-generated fields)
   * @param options Optional transaction context
   * @returns Created entity with all fields
   */
  async create(data: InsertData<T>, options?: CreateOptions): Promise<T> {
    const query = this.getQuery(options);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const [result] = await query.insert(data).returning('*');
    return result as T;
  }

  /**
   * Create multiple entities in a single operation
   *
   * @param data Array of entity data
   * @param options Optional transaction context
   * @returns Array of created entities
   */
  async createMany(data: InsertData<T>[], options?: CreateOptions): Promise<T[]> {
    if (data.length <= 0) return [];

    const query = this.getQuery(options);
    const results = await query.insert(data).returning('*');
    return results as T[];
  }

  /**
   * Get a single entity matching criteria
   *
   * @param criteria Partial entity to match
   * @param options Query options
   * @returns First matching entity or null
   */
  async getOne(criteria: Partial<T>, options?: QueryOptions): Promise<T | null> {
    let query = this.getQuery(options);
    query = query.where(criteria as Record<string, unknown>);
    query = this.applyFilters(query, options);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const result = await query.first();
    return result ? (result as T) : null;
  }

  /**
   * Get multiple entities matching criteria
   *
   * @param criteria Partial entity to match
   * @param options Query options with pagination and ordering
   * @returns Array of matching entities
   */
  async getMany(criteria: Partial<T>, options?: GetManyOptions): Promise<T[]> {
    let query = this.getQuery(options);
    query = query.where(criteria as Record<string, unknown>);
    query = this.applyFilters(query, options);

    if (options?.limit !== undefined && options.limit > 0) query = query.limit(options.limit);
    if (options?.offset !== undefined && options.offset > 0) query = query.offset(options.offset);

    if (options?.orderBy)
      options.orderBy.forEach(({ column, order = 'asc' }) => {
        query = query.orderBy(column, order);
      });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const results = await query;
    return results as T[];
  }

  /**
   * Get all entities in the table
   *
   * @param options Query options with pagination and ordering
   * @returns Array of all entities
   */
  async getAll(options?: GetManyOptions): Promise<T[]> {
    let query = this.getQuery(options);
    query = this.applyFilters(query, options);

    if (options?.limit !== undefined && options.limit > 0) query = query.limit(options.limit);
    if (options?.offset !== undefined && options.offset > 0) query = query.offset(options.offset);

    if (options?.orderBy)
      options.orderBy.forEach(({ column, order = 'asc' }) => {
        query = query.orderBy(column, order);
      });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const results = await query;
    return results as T[];
  }

  /**
   * Check if an entity exists matching criteria
   *
   * @param criteria Partial entity to match (typically all composite key fields)
   * @param options Query options
   * @returns True if entity exists, false otherwise
   */
  async exists(criteria: Partial<T>, options?: QueryOptions): Promise<boolean> {
    const result = await this.getOne(criteria, options);
    return result !== null;
  }

  /**
   * Count entities matching criteria
   *
   * @param criteria Optional partial entity to match
   * @param options Query options
   * @returns Count of matching entities
   */
  async count(criteria?: Partial<T>, options?: QueryOptions): Promise<number> {
    let query = this.getQuery(options);

    if (criteria) query = query.where(criteria as Record<string, unknown>);

    query = this.applyFilters(query, options);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const [result] = await query.count('* as count');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return Number(result?.count ?? 0);
  }

  /**
   * Update entities matching criteria
   *
   * @param criteria Partial entity to match
   * @param data Partial entity with fields to update
   * @param options Optional transaction context
   * @returns True if at least one entity was updated
   */
  async update(
    criteria: Partial<T>,
    data: Partial<Omit<T, 'updated_at' | 'created_at'>>,
    options?: UpdateOptions
  ): Promise<boolean> {
    let query = this.getQuery(options);
    query = query.where(criteria as Record<string, unknown>);
    query = this.applyFilters(query, options);

    const count = await query.update(data);
    return count > 0;
  }

  /**
   * Update multiple entities matching criteria
   *
   * @param criteria Partial entity to match
   * @param data Partial entity with fields to update
   * @param options Optional transaction context
   * @returns Number of entities updated
   */
  async updateMany(
    criteria: Partial<T>,
    data: Partial<Omit<T, 'updated_at' | 'created_at'>>,
    options?: UpdateOptions
  ): Promise<number> {
    let query = this.getQuery(options);
    query = query.where(criteria as Record<string, unknown>);
    query = this.applyFilters(query, options);

    return await query.update(data);
  }

  /**
   * Delete entities matching criteria (hard delete)
   * For composite key tables, we typically use hard delete
   *
   * @param criteria Partial entity to match (typically all composite key fields)
   * @param options Optional transaction context
   * @returns True if at least one entity was deleted
   */
  async delete(criteria: Partial<T>, options?: DeleteOptions): Promise<boolean> {
    let query = this.getQuery(options);
    query = query.where(criteria as Record<string, unknown>);

    // For composite key tables, we don't typically use soft delete filters on delete
    // since the whole point is to remove the relationship

    const count = await query.delete();
    return count > 0;
  }
}
