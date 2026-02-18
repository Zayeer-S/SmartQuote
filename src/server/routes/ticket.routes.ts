import { Router } from 'express';
import type { TicketController } from '../controllers/ticket.controller';
import type { AuthService } from '../services/auth/auth.service';
import type { RBACService } from '../services/rbac/rbac.service';
import { createAuthMiddleware } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/rbac.middleware';
import { PERMISSIONS } from '../../shared/constants/lookup-values';
import { TICKET_ENDPOINTS } from '../../shared/constants';

export function createTicketRoutes(
  ticketController: TicketController,
  authService: AuthService,
  rbacService: RBACService
): Router {
  const router = Router();
  const authenticate = createAuthMiddleware(authService);

  const can = (...perms: Parameters<typeof requirePermission>[1][]) =>
    requirePermission(rbacService, ...perms);

  router.post(
    TICKET_ENDPOINTS.CREATE,
    authenticate,
    can(PERMISSIONS.TICKETS_CREATE),
    ticketController.createTicket
  );

  router.get(
    TICKET_ENDPOINTS.LIST,
    authenticate,
    can(PERMISSIONS.TICKETS_READ_OWN, PERMISSIONS.TICKETS_READ_ALL),
    ticketController.listTickets
  );

  router.get(
    TICKET_ENDPOINTS.GET(),
    authenticate,
    can(PERMISSIONS.TICKETS_READ_OWN, PERMISSIONS.TICKETS_READ_ALL),
    ticketController.getTicket
  );

  router.patch(
    TICKET_ENDPOINTS.UPDATE(),
    authenticate,
    can(PERMISSIONS.TICKETS_UPDATE_OWN, PERMISSIONS.TICKETS_UPDATE_ALL),
    ticketController.updateTicket
  );

  router.delete(
    TICKET_ENDPOINTS.DELETE(),
    authenticate,
    can(PERMISSIONS.TICKETS_DELETE_ALL),
    ticketController.deleteTicket
  );

  router.post(
    TICKET_ENDPOINTS.ASSIGN(),
    authenticate,
    can(PERMISSIONS.TICKETS_ASSIGN),
    ticketController.assignTicket
  );

  router.post(
    TICKET_ENDPOINTS.RESOLVE(),
    authenticate,
    can(PERMISSIONS.TICKETS_UPDATE_ALL),
    ticketController.resolveTicket
  );

  router.get(
    TICKET_ENDPOINTS.LIST_COMMENTS(),
    authenticate,
    can(PERMISSIONS.TICKETS_READ_OWN, PERMISSIONS.TICKETS_READ_ALL),
    ticketController.listComments
  );

  router.post(
    TICKET_ENDPOINTS.ADD_COMMENT(),
    authenticate,
    can(PERMISSIONS.TICKETS_READ_OWN, PERMISSIONS.TICKETS_READ_ALL),
    ticketController.addComment
  );

  return router;
}
