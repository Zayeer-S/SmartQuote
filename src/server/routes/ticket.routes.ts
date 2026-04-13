import type { IncomingFile } from '../services/storage/storage.service.types.js';
import { Router, RequestHandler } from 'express';
import type { TicketController } from '../controllers/ticket.controller.js';
import type { AuthService } from '../services/auth/auth.service.js';
import type { RBACService } from '../services/rbac/rbac.service.js';
import { createAuthMiddleware } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/rbac.middleware.js';
import { PERMISSIONS } from '../../shared/constants/lookup-values.js';
import { TICKET_ENDPOINTS, QUOTE_ENDPOINTS } from '../../shared/constants/index.js';
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

  function parseMultipartFile(buffer: Buffer, contentType: string): IncomingFile {
    const boundaryMatch = /boundary=([^\s;]+)/.exec(contentType);
    if (!boundaryMatch) throw new Error('Missing multipart boundary');

    const boundary = boundaryMatch[1].trim().replace(/^["']|["']$/g, '');
    const delimBuffer = Buffer.from('\r\n--' + boundary);
    const firstDelim = Buffer.from('--' + boundary);

    // Find first boundary
    let pos = buffer.indexOf(firstDelim);
    if (pos === -1) throw new Error('Could not find multipart boundary in body');

    // Skip past boundary + CRLF
    pos += firstDelim.length;
    if (buffer[pos] === 13 && buffer[pos + 1] === 10) pos += 2; // skip CRLF

    // Find end of headers (double CRLF)
    const crlfcrlf = Buffer.from('\r\n\r\n');
    const headerEnd = buffer.indexOf(crlfcrlf, pos);
    if (headerEnd === -1) throw new Error('Could not find end of part headers');

    const headers = buffer.subarray(pos, headerEnd).toString('utf8');
    const dataStart = headerEnd + 4; // skip \r\n\r\n

    // Find next boundary (marks end of file data)
    const dataEnd = buffer.indexOf(delimBuffer, dataStart);
    if (dataEnd === -1) throw new Error('Could not find end of file data');

    const fileBuffer = buffer.subarray(dataStart, dataEnd);

    const filenameMatch = /filename="([^"]+)"/.exec(headers);
    const mimeMatch = /Content-Type:\s*([^\r\n]+)/i.exec(headers);

    if (!filenameMatch) throw new Error('No filename in part headers');
    if (!mimeMatch) throw new Error('No Content-Type in part headers');

    return {
      buffer: fileBuffer,
      originalName: filenameMatch[1],
      mimeType: mimeMatch[1].trim(),
      sizeBytes: fileBuffer.length,
    };
  }

  const parseAttachment: RequestHandler = async (req, _res, next) => {
    const contentType = req.headers['content-type'] ?? '';

    if (!contentType.startsWith('multipart/form-data')) {
      const e = new Error('Expected multipart/form-data');
      (e as NodeJS.ErrnoException).name = 'ValidationError';
      next(e);
      return;
    }

    // Lambda path: serverless-http decodes the binary body into a Buffer before
    // Express sees it. Parse it directly without streaming.
    if (req.body instanceof Buffer) {
      try {
        const file = parseMultipartFile(req.body, contentType);
        (req as unknown as Request & { incomingFile: IncomingFile }).incomingFile = file;
        next();
      } catch (err) {
        next(err);
      }
      return;
    }

    // Direct Express path: used in integration tests and local dev.
    // req is a readable stream - pipe it through busboy.
    // Dynamic import keeps busboy out of the Lambda bundle entirely since
    // this path never executes in Lambda (req.body is always a Buffer there).
    const { default: Busboy } = await import('busboy');

    const chunks: Buffer[] = [];
    let originalName = '';
    let mimeType = '';
    let resolved = false;

    const bb = Busboy({ headers: req.headers });

    bb.on('file', (_field, stream, info) => {
      originalName = info.filename;
      mimeType = info.mimeType;
      stream.on('data', (chunk: Buffer) => chunks.push(chunk));
      stream.on('end', () => {
        // file stream exhausted - busboy will emit 'finish' next
      });
    });

    bb.on('finish', () => {
      if (resolved) return;
      resolved = true;

      if (!originalName) {
        const e = new Error('No file provided');
        (e as NodeJS.ErrnoException).name = 'ValidationError';
        next(e);
        return;
      }

      const buffer = Buffer.concat(chunks);
      const file: IncomingFile = {
        buffer,
        originalName,
        mimeType,
        sizeBytes: buffer.length,
      };
      (req as unknown as Request & { incomingFile: IncomingFile }).incomingFile = file;
      next();
    });

    bb.on('error', (err: Error) => {
      if (resolved) return;
      resolved = true;
      next(err);
    });

    req.pipe(bb);
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

  // Admin-only: requires read-all permission since similarity results expose
  // tickets across all organizations.
  router.get(
    TICKET_ENDPOINTS.SIMILAR(),
    authenticate,
    can(PERMISSIONS.TICKETS_READ_ALL),
    ticketController.getSimilarTickets
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
    TICKET_ENDPOINTS.GET_ATTACHMENT_URL(),
    authenticate,
    can(PERMISSIONS.TICKETS_READ_OWN, PERMISSIONS.TICKETS_READ_ALL),
    ticketController.getAttachmentUrl
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
    can(PERMISSIONS.QUOTES_AGENT_APPROVE),
    quoteController.submitForApproval
  );

  router.post(
    QUOTE_ENDPOINTS.MANAGER_APPROVE(),
    authenticate,
    can(PERMISSIONS.QUOTES_MANAGER_APPROVE),
    quoteController.managerApproveQuote
  );

  router.post(
    QUOTE_ENDPOINTS.MANAGER_REJECT(),
    authenticate,
    can(PERMISSIONS.QUOTES_MANAGER_REJECT),
    quoteController.managerRejectQuote
  );

  router.post(
    QUOTE_ENDPOINTS.ADMIN_APPROVE(),
    authenticate,
    can(PERMISSIONS.QUOTES_ADMIN_APPROVE),
    quoteController.adminApproveQuote
  );

  router.post(
    QUOTE_ENDPOINTS.CUSTOMER_APPROVE(),
    authenticate,
    can(PERMISSIONS.QUOTES_CUSTOMER_APPROVE),
    quoteController.customerApproveQuote
  );

  router.post(
    QUOTE_ENDPOINTS.CUSTOMER_REJECT(),
    authenticate,
    can(PERMISSIONS.QUOTES_CUSTOMER_REJECT),
    quoteController.customerRejectQuote
  );

  router.get(
    QUOTE_ENDPOINTS.REVISIONS(),
    authenticate,
    can(PERMISSIONS.QUOTES_READ_OWN, PERMISSIONS.QUOTES_READ_ALL),
    quoteController.getRevisionHistory
  );

  return router;
}
