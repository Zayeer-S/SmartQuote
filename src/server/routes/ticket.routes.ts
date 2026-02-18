import { Router } from 'express';
import type { TicketController } from '../controllers/ticket.controller';
import type { AuthService } from '../services/auth/auth.service';
import type { RBACService } from '../services/rbac/rbac.service';
import { createAuthMiddleware } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/rbac.middleware';
import { PERMISSIONS } from '../../shared/constants/lookup-values';

export function createTicketRoutes(
  ticketController: TicketController,
  authService: AuthService,
  rbacService: RBACService
): Router {
  const router = Router();
  const authenticate = createAuthMiddleware(authService);

  const can = (...perms: Parameters<typeof requirePermission>[1][]) =>
    requirePermission(rbacService, ...perms);

  router.post('/', authenticate, can(PERMISSIONS.TICKETS_CREATE), ticketController.createTicket);

  router.get(
    '/',
    authenticate,
    can(PERMISSIONS.TICKETS_READ_OWN, PERMISSIONS.TICKETS_READ_ALL),
    ticketController.listTickets
  );

  router.get(
    '/:ticketId',
    authenticate,
    can(PERMISSIONS.TICKETS_READ_OWN, PERMISSIONS.TICKETS_READ_ALL),
    ticketController.getTicket
  );

  router.patch(
    '/:ticketId',
    authenticate,
    can(PERMISSIONS.TICKETS_UPDATE_OWN, PERMISSIONS.TICKETS_UPDATE_ALL),
    ticketController.updateTicket
  );

  router.delete(
    '/:ticketId',
    authenticate,
    can(PERMISSIONS.TICKETS_DELETE_ALL),
    ticketController.deleteTicket
  );

  router.post(
    '/:ticketId/assign',
    authenticate,
    can(PERMISSIONS.TICKETS_ASSIGN),
    ticketController.assignTicket
  );

  router.post(
    '/:ticketId/resolve',
    authenticate,
    can(PERMISSIONS.TICKETS_UPDATE_ALL),
    ticketController.resolveTicket
  );

  router.get(
    '/:ticketId/comments',
    authenticate,
    can(PERMISSIONS.TICKETS_READ_OWN, PERMISSIONS.TICKETS_READ_ALL),
    ticketController.listComments
  );

  router.post(
    '/:ticketId/comments',
    authenticate,
    can(PERMISSIONS.TICKETS_READ_OWN, PERMISSIONS.TICKETS_READ_ALL),
    ticketController.addComment
  );

  return router;
}
