import { loadSecrets } from './secrets.js';

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
    seeds: {
      directory: './server/database/seeds',
      loadExtensions: ['.js'],
    },
  });

  try {
    console.log('Running seeds...');
    const [log] = (await db.seed.run()) as unknown as [string[], unknown];

    if (log.length === 0) {
      const message = 'No seed files found';
      console.log(message);
      return { success: true, message };
    }

    const message = `Ran ${String(log.length)} seed file(s): ${log.join(', ')}`;
    console.log(message);
    return { success: true, message };
  } catch (error) {
    const message = `Seeding failed: ${error instanceof Error ? error.message : String(error)}`;
    console.error(message);
    throw new Error(message);
  } finally {
    await db.destroy();
  }
};
