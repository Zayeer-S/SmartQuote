import { knex, type Knex } from 'knex';
import { backEnv, getDatabaseConfig } from '../config/index.js';

let instance: Knex | null = null;

/**
 * Get database connection singleton. Creates a new instance if one doesn't exist.
 *
 * @returns Knex database instance
 */
export function getDb(): Knex {
  if (!instance) {
    const config = getDatabaseConfig(backEnv.NODE_ENV);
    instance = knex(config);
  }
  return instance;
}

/**
 * Test database connection health. Executes a select query to verify connectivity.
 *
 * @returns Promise resolving to true if connection is healthy, false otherwise
 */
export async function testConnection(): Promise<boolean> {
  try {
    const db = getDb();
    await db.raw('SELECT 1');
    return true;
  } catch (err) {
    console.error('Database connection test failed:', err);
    return false;
  }
}

/**
 * Close database connection gracefully
 *
 * @returns Promise resolving when connection is closed
 */
export async function closeDb(): Promise<void> {
  if (instance) {
    await instance.destroy();
    instance = null;
  }
}

/**
 * Reset database connection. Only available in test environment for test environment isolation.
 *
 * @throws Error if called outside test environment
 * @return Promise resolving when connection is reset
 */
export async function resetConnection(): Promise<void> {
  if (backEnv.NODE_ENV === 'test')
    throw new Error(`${resetConnection.name} can only be called in test environments`);
  await closeDb();
}

/**
 * Get current connection status
 *
 * @returns true if connection instance exists, false otherwise
 */
export function isConnected(): boolean {
  return instance !== null;
}
