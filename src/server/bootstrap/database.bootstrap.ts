import knex, { Knex } from 'knex';
import { getConfig } from '../config/database-config.js';

let dbInstance: Knex | null = null;

export async function initializeDatabase(): Promise<Knex> {
  if (dbInstance) return dbInstance;

  console.log('Initializing database connection...');

  const config = getConfig();
  dbInstance = knex(config);

  try {
    await dbInstance.raw('SELECT 1');
    console.log('Database connection established successfully');
  } catch (error) {
    console.error('Failed to connect to database:', error);
    throw error;
  }

  return dbInstance;
}

/** Get database instance. Must be initialized first */
export function getDatabase(): Knex {
  if (!dbInstance) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return dbInstance;
}

export async function closeDatabase(): Promise<void> {
  if (dbInstance) {
    await dbInstance.destroy();
    dbInstance = null;
    console.log('Database connection closed');
  }
}
