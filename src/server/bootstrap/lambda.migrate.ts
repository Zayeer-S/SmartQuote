import { loadSecrets } from './secrets.js';
import { readdirSync } from 'fs';

export const handler = async (): Promise<{ success: boolean; message: string }> => {
  await loadSecrets();

  const { default: knex } = await import('knex');

  const db = knex({
    client: 'pg',
    connection: {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT ?? '5432'),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: { rejectUnauthorized: false },
    },
    migrations: {
      directory: './migrations',
      tableName: 'knex_migrations',
      loadExtensions: ['.js', '.mjs'],
    },
  });

  try {
    console.log('Running migrations...');

    console.log('Migration files:', readdirSync('./migrations'));

    const [batchNo, migrations] = (await db.migrate.latest()) as [number, string[]];

    if (migrations.length === 0) {
      const message = 'No migrations to run — already up to date';
      console.log(message);
      return { success: true, message };
    }

    const message = `Batch ${String(batchNo)} — ran ${String(migrations.length)} migration(s): ${migrations.join(', ')}`;
    console.log(message);
    return { success: true, message };
  } catch (error) {
    const message = `Migration failed: ${error instanceof Error ? error.message : String(error)}`;
    console.error(message);
    throw new Error(message);
  } finally {
    await db.destroy();
  }
};
