import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { initializeDatabase } from './database.bootstrap';
import { backEnv } from '../config';
import { AuthContainer } from '../containers/auth.container';
import { AdminContainer } from '../containers/admin.container';
import { createAuthRoutes } from '../routes/auth.routes';
import { createAdminRoutes } from '../routes/admin.routes';
import { authConfig } from '../config/auth-config';
import type { SessionService } from '../services/auth/session.service';
import { errorHandler, notFoundHandler } from '../middleware/error.middleware';
import { TicketContainer } from '../containers/ticket.container';
import { createTicketRoutes } from '../routes/ticket.routes';
import { QuoteContainer } from '../containers/quote.container';

export async function bootstrapApplication(): Promise<Express> {
  console.log('Bootstrapping application...');

  const db = await initializeDatabase();

  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: backEnv.CORS_ORIGIN,
      credentials: true,
    })
  );

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use((req, _res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });

  console.log('Initializing containers...');
  const authContainer = new AuthContainer(db);
  const adminContainer = new AdminContainer(db, authContainer.authService);
  const ticketContainer = new TicketContainer(db, adminContainer.rbacService);
  const quoteContainer = new QuoteContainer(db, adminContainer.rbacService);

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

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  startSessionCleanupJob(authContainer.sessionService);

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
