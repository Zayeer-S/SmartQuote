import { initializeDatabase } from './database.bootstrap.js';
import { AuthContainer } from '../containers/auth.container.js';
import { AdminContainer } from '../containers/admin.container.js';
import { TicketsDAO } from '../daos/children/tickets-domain.dao.js';
import { ConnectionManager } from '../realtime/connection-manager.js';
import { RoomResolver } from '../realtime/room-resolver.js';
import type { SessionService } from '../services/auth/session.service.js';

export interface WsBootstrapResult {
  sessionService: SessionService;
  connectionManager: ConnectionManager;
  roomResolver: RoomResolver;
}

/**
 * Minimal bootstrap for the standalone WS server.
 *
 * Only initializes what the WS server actually uses:
 *   - DB connection (for DAO queries during room auth)
 *   - SessionService (to validate tokens on connect)
 *   - RBACService + OrgMembersDAO + TicketsDAO (for RoomResolver permission checks)
 *   - ConnectionManager + RoomResolver
 *
 * No Express app, no route containers, no embedder, no background jobs.
 */
export async function bootstrapWsServer(): Promise<WsBootstrapResult> {
  console.log('Bootstrapping WS server...');

  const db = await initializeDatabase();

  const authContainer = new AuthContainer(db);
  const adminContainer = new AdminContainer(
    db,
    authContainer.authService,
    authContainer.orgMembersDAO
  );
  const ticketsDAO = new TicketsDAO(db);

  const connectionManager = new ConnectionManager();
  const roomResolver = new RoomResolver(
    adminContainer.rbacService,
    authContainer.orgMembersDAO,
    ticketsDAO
  );

  console.log('WS server bootstrapped successfully');

  return {
    sessionService: authContainer.sessionService,
    connectionManager,
    roomResolver,
  };
}
