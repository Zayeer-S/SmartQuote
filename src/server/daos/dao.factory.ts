import type { Knex } from 'knex';
import { getDb } from '../database/connection';

type DaoConstructor<T> = new (db: Knex) => T;

export class DAOFactory {
  private db: Knex;
  private instances = new Map<string, unknown>();

  constructor(db?: Knex) {
    this.db = db ?? getDb();
  }

  private setup<T>(tableName: string, DAO: DaoConstructor<T>): T {
    if (!this.instances.has(tableName)) this.instances.set(tableName, new DAO(this.db));
    return this.instances.get(tableName) as T;
  }

  /** Clears all cached DAO instances. Returns true if empty, false if failed. */
  clearCache(): boolean {
    this.instances.clear();
    return this.instances.size === 0;
  }

  /** Get count of instantiated DAOs */
  getCacheSize(): number {
    return this.instances.size;
  }

  /** Get list of instantiated DAO names */
  getInstantiatedDAOs(): string[] {
    return Array.from(this.instances.keys());
  }
}

export const dao = new DAOFactory();
