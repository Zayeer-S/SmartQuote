import busboy from 'busboy';
import type { IncomingFile } from '../services/storage/storage.service.types.js';
import { Router, RequestHandler } from 'express';
import { Readable } from 'stream';
import type { TicketController } from '../controllers/ticket.controller.js';
import type { AuthService } from '../services/auth/auth.service.js';
import type { RBACService } from '../services/rbac/rbac.service.js';
import { createAuthMiddleware } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/rbac.middleware.js';
import { PERMISSIONS } from '../../shared/constants/lookup-values.js';
import { TICKET_ENDPOINTS, QUOTE_ENDPOINTS } from '../../shared/constants';
import type { QuoteController } from '../controllers/quote.controller.js';

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

  function parseMultipartFile(req: Request): Promise<IncomingFile> {
    return new Promise((resolve, reject) => {
      const body = req.body as unknown as Buffer;
      const bb = busboy({ headers: req.headers as unknown as Record<string, string> });
      let resolved = false;

      bb.on('file', (_field, stream, info) => {
        const chunks: Buffer[] = [];
        stream.on('data', (chunk: Buffer) => chunks.push(chunk));
        stream.on('end', () => {
          resolved = true;
          resolve({
            buffer: Buffer.concat(chunks),
            originalName: info.filename,
            mimeType: info.mimeType,
            sizeBytes: Buffer.concat(chunks).byteLength,
          });
        });
        stream.on('error', reject);
      });

      bb.on('finish', () => {
        if (!resolved) reject(new Error('No file found in request'));
      });
      bb.on('error', reject);

      const readable = Readable.from(body);

      readable.pipe(bb);
    });
  }

  const parseAttachment: RequestHandler = (req, _res, next) => {
    if (!(req.body instanceof Buffer)) {
      next(new Error('Expected binary body'));
      return;
    }
    parseMultipartFile(req as unknown as Request)
      .then((file) => {
        (req as unknown as Request & { incomingFile: IncomingFile }).incomingFile = file;
        next();
      })
      .catch(next);
  };

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

  router.post(
    TICKET_ENDPOINTS.UPLOAD_ATTACHMENT(),
    authenticate,
    can(PERMISSIONS.TICKETS_CREATE),
    parseAttachment,
    ticketController.uploadAttachment
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
