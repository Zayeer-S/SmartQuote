import { Router } from 'express';
import type { TicketController } from '../controllers/ticket.controller';
import type { AuthService } from '../services/auth/auth.service';
import type { RBACService } from '../services/rbac/rbac.service';
import { createAuthMiddleware } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/rbac.middleware';
import { PERMISSIONS } from '../../shared/constants/lookup-values';
import { TICKET_ENDPOINTS, QUOTE_ENDPOINTS } from '../../shared/constants';
import type { QuoteController } from '../controllers/quote.controller';

export function createTicketRoutes(
  ticketController: TicketController,
  quoteController: QuoteController,
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

  router.get(
    QUOTE_ENDPOINTS.LIST(),
    authenticate,
    can(PERMISSIONS.QUOTES_READ_OWN, PERMISSIONS.QUOTES_READ_ALL),
    quoteController.listQuotes
  );

  router.post(
    QUOTE_ENDPOINTS.GENERATE(),
    authenticate,
    can(PERMISSIONS.QUOTES_CREATE),
    quoteController.generateQuote
  );

  router.post(
    QUOTE_ENDPOINTS.CREATE_MANUAL(),
    authenticate,
    can(PERMISSIONS.QUOTES_CREATE),
    quoteController.createManualQuote
  );

  router.get(
    QUOTE_ENDPOINTS.GET(),
    authenticate,
    can(PERMISSIONS.QUOTES_READ_OWN, PERMISSIONS.QUOTES_READ_ALL),
    quoteController.getQuote
  );

  router.patch(
    QUOTE_ENDPOINTS.UPDATE(),
    authenticate,
    can(PERMISSIONS.QUOTES_UPDATE),
    quoteController.updateQuote
  );

  router.post(
    QUOTE_ENDPOINTS.SUBMIT(),
    authenticate,
    can(PERMISSIONS.QUOTES_CREATE),
    quoteController.submitForApproval
  );

  router.post(
    QUOTE_ENDPOINTS.APPROVE(),
    authenticate,
    can(PERMISSIONS.QUOTES_APPROVE),
    quoteController.approveQuote
  );

  router.post(
    QUOTE_ENDPOINTS.REJECT(),
    authenticate,
    can(PERMISSIONS.QUOTES_REJECT),
    quoteController.rejectQuote
  );

  router.get(
    QUOTE_ENDPOINTS.REVISIONS(),
    authenticate,
    can(PERMISSIONS.QUOTES_READ_OWN, PERMISSIONS.QUOTES_READ_ALL),
    quoteController.getRevisionHistory
  );

  return router;
}
