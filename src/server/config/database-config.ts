import type { Knex } from 'knex';
import path from 'path';
import { fileURLToPath } from 'url';
import { backEnv } from './env.backend';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const baseConfig: Partial<Knex.Config> = {
  client: 'pg',
  migrations: {
    directory: path.join(__dirname, '..', 'database', 'migrations'),
    extension: 'ts',
    tableName: 'knex_migrations',
  },
  seeds: {
    directory: path.join(__dirname, '..', 'database', 'seeds'),
    extension: 'ts',
  },
};

const developmentConfig: Knex.Config = {
  ...baseConfig,
  connection: {
    host: backEnv.DB_HOST,
    port: backEnv.DB_PORT,
    database: backEnv.DB_NAME,
    user: backEnv.DB_USER,
    password: backEnv.DB_PASSWORD,
  },
  pool: {
    min: 2,
    max: 10,
  },
  debug: true,
};

const testConfig: Knex.Config = {
  ...baseConfig,
  connection: {
    host: backEnv.DB_HOST,
    port: backEnv.DB_PORT,
    database: backEnv.DB_NAME,
    user: backEnv.DB_USER,
    password: backEnv.DB_PASSWORD,
  },
  pool: {
    min: 1,
    max: 5,
  },
  debug: false,
};

const stagingConfig: Knex.Config = {
  ...baseConfig,
  connection: {
    host: backEnv.DB_HOST,
    port: backEnv.DB_PORT,
    database: backEnv.DB_NAME,
    user: backEnv.DB_USER,
    password: backEnv.DB_PASSWORD,
    ssl: { rejectUnauthorized: false },
  },
  pool: {
    min: 2,
    max: 10,
  },
  debug: false,
};

/**
 * Production environment configuration
 * Uses AWS RDS with connection pooling
 */
const productionConfig: Knex.Config = {
  ...baseConfig,
  connection: {
    host: backEnv.DB_HOST,
    port: backEnv.DB_PORT,
    database: backEnv.DB_NAME,
    user: backEnv.DB_USER,
    password: backEnv.DB_PASSWORD,
    ssl: { rejectUnauthorized: false },
  },
  pool: {
    min: 2,
    max: 20,
  },
  debug: false,
};

/** Configuration object for all environments */
export const databaseConfig: Record<string, Knex.Config> = {
  development: developmentConfig,
  test: testConfig,
  staging: stagingConfig,
  production: productionConfig,
};

/**
 * Get configuration for a specific environment
 * Defaults to current NODE_ENV
 */
export function getConfig(environment?: string): Knex.Config {
  const targetEnv = environment ?? backEnv.NODE_ENV;
  const envConfig = databaseConfig[targetEnv];

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!envConfig) throw new Error(`No database configuration found for environment: ${targetEnv}`);

  return envConfig;
}

export default databaseConfig;
