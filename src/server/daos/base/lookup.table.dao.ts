import type { BaseLookupTable } from '../../database/types/tables';
import { ActivatableDAO } from '../base/activatable.dao';
import type { PrimaryKey, QueryOptions } from '../base/types';

export abstract class LookupTableDAO<
  T extends BaseLookupTable & { id: ID },
  ID extends PrimaryKey = PrimaryKey,
> extends ActivatableDAO<T, ID> {
  /**
   * Find a lookup table entry by name
   *
   * @param name The name to search for
   * @param options Query options
   * @returns Lookup entry or null if not found
   */
  async findByName(name: string, options?: QueryOptions): Promise<T | null> {
    return await this.getOne({ name } as Partial<T>, options);
  }

  /**
   * Find multiple lookup table entries by their names
   *
   * @param names Array of names to search for
   * @param options Query options
   * @returns Array of matching lookup entries
   */
  async findByNames(names: string[], options?: QueryOptions): Promise<T[]> {
    if (names.length <= 0) return [];

    let query = this.getQuery(options);
    query = query.whereIn('name', names);
    query = this.applyFilters(query, options);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const results = await query;
    return results as T[];
  }
}
