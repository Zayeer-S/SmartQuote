import { loadSecrets } from './secrets.js';

export const handler = async (): Promise<{ success: boolean; message: string }> => {
  await loadSecrets();

  const [{ default: knex }, { getConfig }] = await Promise.all([
    import('knex'),
    import('../config/database-config.js'),
  ]);

  const db = knex(getConfig('production'));

  try {
    console.log('Running migrations...');
    const [batchNo, migrations] = (await db.migrate.latest()) as [number, string[]];

    if (migrations.length === 0) {
      const message = 'No migrations to run. Already up to date';
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
