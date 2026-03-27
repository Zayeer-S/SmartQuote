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
import { RateProfileContainer } from '../containers/rate.profiles.container.js';
import { createRateProfileRoutes } from '../routes/rate.profiles.routes.js';
import { LookupResolver } from '../lib/lookup-resolver.js';
import { loadLookupMaps } from '../lib/lookup-maps.js';
import { BertEmbedder } from '../lib/nlp/bert-embedder.js';
import { PriorityEngineAnchorsDAO } from '../daos/children/ticket.priority.dao.js';
import { AnalyticsContainer } from '../containers/analytics.container.js';
import { createAnalyticsRoutes } from '../routes/analytics.routes.js';
import { RATE_PROFILE_ENDPOINTS, SLA_ENDPOINTS } from '../../shared/constants/endpoints.js';
import { SlaContainer } from '../containers/sla.container.js';
import { createSlaRoutes } from '../routes/sla.routes.js';
import { EmailService } from '../services/email/email.service.js';
import { NotificationService } from '../services/notification/notification.service.js';
import { NotificationTypesDAO } from '../daos/children/notification.types.dao.js';
import { UserNotificationPreferencesDAO } from '../daos/children/users.domain.dao.js';

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

  // TODO MOVE TO TICKET CONTROLLER
  let embedder: BertEmbedder | null = null;
  // The embedder requires AWS (Bedrock). In Lambda AWS_REGION is always set as
  // a reserved runtime variable, so NODE_ENV=production is the reliable signal
  // that we're running in Lambda with the execution role available.
  // AWS_ACCESS_KEY_ID is NOT a valid signal - Lambda injects it automatically
  // as a temporary STS credential, making it truthy in all Lambda invocations.
  const awsRegion = backEnv.AWS_REGION ?? process.env.AWS_REGION;
  if (awsRegion !== undefined && backEnv.NODE_ENV === 'production') {
    console.log('Initializing NLP embedder...');
    embedder = new BertEmbedder();
    const anchors = await new PriorityEngineAnchorsDAO(db).getAll({ includeInactive: true });
    await embedder.warmAnchors(anchors);
    console.log(`NLP embedder ready (${String(anchors.length)} anchors warmed).`);
  } else {
    console.log(
      'AWS region not set or not in production -- NLP embedder skipped, using rule-based scoring only.'
    );
  }

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
      if (req.headers['content-type']?.startsWith('multipart/form-data')) {
        next();
        return;
      }
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

  app.use((req, res, next) => {
    // Same guard - urlencoded parser must not run on multipart requests
    if (req.headers['content-type']?.startsWith('multipart/form-data')) {
      next();
      return;
    }
    express.urlencoded({ extended: true })(req, res, next);
  });

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
  const slaContainer = new SlaContainer(
    db,
    adminContainer.rbacService,
    authContainer.orgMembersDAO
  );

  const emailService = new EmailService();
  const notificationService = new NotificationService(
    emailService,
    new UserNotificationPreferencesDAO(db),
    new NotificationTypesDAO(db)
  );

  const ticketContainer = new TicketContainer(
    db,
    adminContainer.rbacService,
    authContainer.orgMembersDAO,
    lookupResolver,
    embedder,
    slaContainer.slaService,
    notificationService
  );
  const quoteContainer = new QuoteContainer(
    db,
    adminContainer.rbacService,
    lookupResolver,
    authContainer.orgMembersDAO,
    notificationService
  );
  const orgContainer = new OrgContainer(
    db,
    adminContainer.rbacService,
    authContainer.orgMembersDAO
  );
  const rateProfileContainer = new RateProfileContainer(
    db,
    adminContainer.rbacService,
    lookupResolver
  );
  const analyticsContainer = new AnalyticsContainer(db, adminContainer.rbacService);

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
  app.use(
    `/api${RATE_PROFILE_ENDPOINTS.BASE}`,
    createRateProfileRoutes(rateProfileContainer.rateProfileController, authContainer.authService)
  );
  app.use(
    '/api/analytics',
    createAnalyticsRoutes(
      analyticsContainer.analyticsController,
      authContainer.authService,
      adminContainer.rbacService
    )
  );
  app.use(
    `/api${SLA_ENDPOINTS.BASE}`,
    createSlaRoutes(
      slaContainer.slaController,
      authContainer.authService,
      adminContainer.rbacService
    )
  );

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
