import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { initializeDatabase } from './database.bootstrap.js';
import { backEnv } from '../config/env.backend.js';
import { AuthContainer } from '../containers/auth.container.js';
import { AdminContainer } from '../containers/admin.container.js';
import { createAuthRoutes } from '../routes/auth.routes.js';
import { createAdminRoutes } from '../routes/admin.routes.js';
import { authConfig } from '../config/auth-config.js';
import type { SessionService } from '../services/auth/session.service.js';
import { errorHandler, notFoundHandler } from '../middleware/error.middleware.js';
import { TicketContainer } from '../containers/ticket.container.js';
import { createTicketRoutes } from '../routes/ticket.routes.js';
import { QuoteContainer } from '../containers/quote.container.js';
import { OrgContainer } from '../containers/org.container.js';
import { createOrgRoutes } from '../routes/org.routes.js';
import { LookupResolver } from '../lib/lookup-resolver.js';
import { loadLookupMaps } from '../lib/lookup-maps.js';
import { BertEmbedder } from '../lib/nlp/bert-embedder.js';
import { PriorityEngineAnchorsDAO } from '../daos/children/ticket.priority.dao.js';

interface BootstrapOptions {
  /** Set to false in Lambda - background jobs are meaningless in stateless invocations */
  runBackgroundJobs?: boolean;
}

export async function bootstrapApplication(
  options: BootstrapOptions = { runBackgroundJobs: true }
): Promise<Express> {
  console.log('Bootstrapping application...');

  const db = await initializeDatabase();
  const lookupResolver = new LookupResolver(await loadLookupMaps(db));

  console.log('Initializing NLP embedder...');
  const embedder = new BertEmbedder();
  await embedder.init();
  const anchors = await new PriorityEngineAnchorsDAO(db).getAll({ includeInactive: true });
  await embedder.warmAnchors(anchors);
  console.log(`NLP embedder ready (${String(anchors.length)} anchors warmed).`);

  const app = express();

  // Trust the first proxy hop (CloudFront => API Gateway => Lambda).
  // Required so express-rate-limit can read X-Forwarded-For without throwing
  // ERR_ERL_UNEXPECTED_X_FORWARDED_FOR, and so req.ip reflects the real client IP.
  app.set('trust proxy', 1);

  app.use(helmet());
  app.use(
    cors({
      origin: backEnv.CORS_ORIGIN,
      credentials: true,
    })
  );

  app.use((req, res, next) => {
    if (req.body instanceof Buffer) {
      try {
        req.body = JSON.parse(req.body.toString('utf8')) as unknown;
      } catch {
        req.body = {};
      }
      next();
    } else {
      express.json()(req, res, next);
    }
  });
  app.use(express.urlencoded({ extended: true }));

  app.use((req, _res, next) => {
    console.log(`${req.method} ${req.path}`);
    console.log('Content-Type:', req.headers['content-type']);
    console.log('Body after parse:', JSON.stringify(req.body));
    next();
  });

  console.log('Initializing containers...');
  const authContainer = new AuthContainer(db);
  const adminContainer = new AdminContainer(
    db,
    authContainer.authService,
    authContainer.orgMembersDAO
  );
  const ticketContainer = new TicketContainer(
    db,
    adminContainer.rbacService,
    authContainer.orgMembersDAO,
    lookupResolver,
    embedder
  );
  const quoteContainer = new QuoteContainer(
    db,
    adminContainer.rbacService,
    lookupResolver,
    authContainer.orgMembersDAO
  );
  const orgContainer = new OrgContainer(
    db,
    adminContainer.rbacService,
    authContainer.orgMembersDAO
  );

  console.log('Registering routes...');
  app.use('/api/auth', createAuthRoutes(authContainer.authController, authContainer.authService));
  app.use(
    '/api/admin',
    createAdminRoutes(
      adminContainer.adminController,
      authContainer.authService,
      adminContainer.rbacService
    )
  );
  app.use(
    '/api/tickets',
    createTicketRoutes(
      ticketContainer.ticketController,
      quoteContainer.quoteController,
      authContainer.authService,
      adminContainer.rbacService
    )
  );
  app.use('/api/orgs', createOrgRoutes(orgContainer.orgController, authContainer.authService));

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  if (options.runBackgroundJobs) {
    startSessionCleanupJob(authContainer.sessionService);
  }

  app.use(notFoundHandler);
  app.use(errorHandler);

  console.log('Application bootstrapped successfully');

  return app;
}

/** Start background job to clean up expired sessions */
function startSessionCleanupJob(sessionService: SessionService): void {
  const intervalMs = authConfig.cleanupIntervalMinutes * 60 * 1000;

  console.log(
    `Starting session cleanup job (runs every ${String(authConfig.cleanupIntervalMinutes)} minutes)`
  );

  setInterval(() => {
    void (async () => {
      try {
        const deletedCount = await sessionService.cleanupExpired();
        if (deletedCount > 0) {
          console.log(`Session cleanup: deleted ${String(deletedCount)} expired sessions`);
        }
      } catch (error) {
        console.error('Session cleanup error:', error);
      }
    })();
  }, intervalMs);
}
