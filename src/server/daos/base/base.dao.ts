import type { Knex } from 'knex';
import type {
  ActivatableEntity,
  BaseEntity,
  CreateOptions,
  GetManyOptions,
  IBaseDAO,
  InsertData,
  PrimaryKey,
  QueryOptions,
  SoftDeletableEntity,
  TableConfig,
  UpdateOptions,
} from './types.js';

export abstract class BaseDAO<
  T extends BaseEntity<ID>,
  ID extends PrimaryKey = PrimaryKey,
> implements IBaseDAO<T, ID> {
  protected db: Knex;
  protected tableName: string;
  protected primaryKey: string;
  private hasSoftDelete: boolean;
  private hasActivation: boolean;

  constructor(config: TableConfig, db: Knex) {
    this.tableName = config.tableName;
    this.primaryKey = config.primaryKey;
    this.db = db;

    // Determine capabilities based on DAO class hierarchy
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

  /** Type guard to check if entity is deletable */
  protected isSoftDelete(entity: T): entity is T & SoftDeletableEntity<ID> {
    return 'deleted_at' in entity;
  }

  /** Type guard to check if entity is activateable */
  protected isActivatable(entity: T): entity is T & ActivatableEntity<ID> {
    return 'is_active' in entity;
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
   * Gets a single entity by its primary key
   *
   * @param id Primary key value
   * @param options
   * @returns Entity or null if not found
   */
  async getById(id: ID, options?: QueryOptions): Promise<T | null> {
    let query = this.getQuery(options);
    query = query.where(this.primaryKey, id);

    query = this.applyFilters(query, options);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const result = await query.first();
    return result ? (result as T) : null;
  }

  /**
   * Get multiple entitites by their primary keys
   *
   * @param ids Array of primary key values
   * @param options Query options
   * @returns Array of matching options
   */
  async getByManyIds(ids: ID[], options?: QueryOptions): Promise<T[]> {
    if (ids.length <= 0) return [];

    let query = this.getQuery(options);
    query = query.whereIn(this.primaryKey, ids);
    query = this.applyFilters(query, options);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const results = await query;
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
   * @param options  Query options with pagination and ordering
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
   * Check if an entity exists by its primary key
   *
   * @param id Primary key value
   * @param options
   * @returns True if entity exsits, false otherwise
   */
  async exists(id: ID, options?: QueryOptions): Promise<boolean> {
    const result = await this.getById(id, options);
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
    data: Partial<Omit<T, 'id' | 'updated_at' | 'created_at'>>,
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
   * @param criteria - Partial entity to match
   * @param data - Partial entity with fields to update
   * @param options - Optional transaction context
   * @returns Number of entities updated
   */
  async updateMany(
    criteria: Partial<T>,
    data: Partial<Omit<T, 'id' | 'updated_at' | 'created_at'>>,
    options?: UpdateOptions
  ): Promise<number> {
    let query = this.getQuery(options);
    query = query.where(criteria as Record<string, unknown>);
    query = this.applyFilters(query, options);

    return await query.update(data);
  }
}
