import { afterAll, beforeAll } from 'vitest';
import knex, { type Knex } from 'knex';
import { getConfig } from '../../src/server/config/database-config';

if (process.env.NODE_ENV !== 'test') {
  throw new Error('[integration setup] NODE_ENV must be "test" when running integration tests.');
}

let db: Knex;

beforeAll(async () => {
  const config = getConfig('test');

  // Knex's migration/seed runner uses Node module resolution which doesn't
  // understand .ts files natively. We override the loader so tsx handles them,
  // matching the same runtime your npm scripts use.
  db = knex({
    ...config,
    migrations: {
      ...config.migrations,
      loadExtensions: ['.ts'],
    },
    seeds: {
      ...config.seeds,
      loadExtensions: ['.ts'],
    },
  });

  await db.migrate.latest();
  await db.seed.run();
});

afterAll(async () => {
  await db.destroy();
});

export { db };
