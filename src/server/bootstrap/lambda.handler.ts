import { loadSecrets } from './secrets.js';

let cachedHandler: ((event: unknown, context: unknown) => Promise<unknown>) | null = null;

async function getHandler(): Promise<(event: unknown, context: unknown) => Promise<unknown>> {
  if (cachedHandler) return cachedHandler;

  // Must run before any config module is imported — they all read process.env synchronously
  await loadSecrets();

  // Dynamic import ensures app.bootstrap (and all its config dependencies) only
  // load after process.env has been fully populated by loadSecrets()
  const [{ bootstrapApplication }, { default: serverless }] = await Promise.all([
    import('./app.bootstrap.js'),
    import('serverless-http'),
  ]);

  const app = await bootstrapApplication({ runBackgroundJobs: false });
  cachedHandler = serverless(app) as (event: unknown, context: unknown) => Promise<unknown>;

  return cachedHandler;
}

export const handler = async (event: unknown, context: unknown): Promise<unknown> => {
  const h = await getHandler();
  return h(event, context);
};
