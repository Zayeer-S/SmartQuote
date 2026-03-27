import type { Request, Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { validateOrThrow } from '../validators/validation-utils.js';
import {
  addCommentSchema,
  assignTicketSchema,
  createTicketSchema,
  listTicketsQuerySchema,
  updateTicketSchema,
} from '../validators/ticket.validator.js';
import { success, error } from '../lib/respond.js';
import type {
  AttachmentResponse,
  CommentResponse,
  ListCommentsResponse,
  ListSimilarTicketsResponse,
  ListTicketsResponse,
  SimilarQuoteResponse,
  SimilarTicketResponse,
  TicketDetailResponse,
  TicketResponse,
  TicketSummaryResponse,
} from '../../shared/contracts/ticket-contracts.js';
import type { SlaStatusResponse } from '../../shared/contracts/sla-contracts.js';
import type { UserId, TicketId } from '../database/types/ids.js';
import type { Ticket, TicketAttachment, TicketWithDetails } from '../database/types/tables.js';
import type { OrganizationId } from '../database/types/ids.js';
import type { TicketService } from '../services/ticket/ticket.service.js';
import type { CommentService, EnrichedComment } from '../services/ticket/comment.service.js';
import type { AttachmentService } from '../services/ticket/attachment.service.js';
import type { SlaService } from '../services/sla/sla.service.js';
import type { TicketSimilarityService } from '../services/ticket/ticket-similarity.service.js';
import type { SimilarTicketResult } from '../services/ticket/ticket-similarity.service.types.js';
import type { LookupResolver } from '../lib/lookup-resolver.js';
import type { IncomingFile } from '../services/storage/storage.service.types.js';
import type { QuoteWithApproval } from '../database/types/tables.js';
import { backEnv } from '../config/env.backend.js';

/** Shape attached to req by the parseAttachment middleware in ticket.routes.ts */
interface RequestWithIncomingFile extends Request {
  incomingFile?: IncomingFile;
}

export class TicketController {
  private ticketService: TicketService;
  private commentService: CommentService;
  private attachmentService: AttachmentService;
  private slaService: SlaService;
  private similarityService: TicketSimilarityService;
  private lookup: LookupResolver;

  constructor(
    ticketService: TicketService,
    commentService: CommentService,
    attachmentService: AttachmentService,
    slaService: SlaService,
    similarityService: TicketSimilarityService,
    lookup: LookupResolver
  ) {
    this.ticketService = ticketService;
    this.commentService = commentService;
    this.attachmentService = attachmentService;
    this.slaService = slaService;
    this.similarityService = similarityService;
    this.lookup = lookup;
  }

  createTicket = async (req: Request, res: Response): Promise<void> => {
    try {
      const actor = (req as AuthenticatedRequest).user;
      const body = validateOrThrow(createTicketSchema, req.body);

      const ticket = await this.ticketService.createTicket(
        {
          title: body.title,
          description: body.description,
          ticket_type_id: this.lookup.ticketTypeId(body.ticketType),
          ticket_severity_id: this.lookup.ticketSeverityId(body.ticketSeverity),
          business_impact_id: this.lookup.businessImpactId(body.businessImpact),
          deadline: new Date(body.deadline),
          users_impacted: body.usersImpacted,
        },
        actor.id as UserId
      );

      success(res, this.mapTicket(ticket), 201);
    } catch (err: unknown) {
      handleError(res, err);
    }
  };

  uploadAttachment = async (req: Request, res: Response): Promise<void> => {
    try {
      const actor = (req as AuthenticatedRequest).user;
      const ticketId = req.params.ticketId as TicketId;
      const file = (req as RequestWithIncomingFile).incomingFile;

      if (!file) {
        error(res, 400, 'No file provided');
        return;
      }

      const attachment = await this.attachmentService.uploadAttachment(
        file,
        ticketId,
        actor.id as UserId
      );

      success(res, this.mapAttachment(attachment), 201);
    } catch (err: unknown) {
      handleError(res, err);
    }
  };

  getTicket = async (req: Request, res: Response): Promise<void> => {
    try {
      const actor = (req as AuthenticatedRequest).user;
      const ticket = await this.ticketService.getTicket(
        req.params.ticketId as TicketId,
        actor.id as UserId
      );

      const [attachments, slaStatus] = await Promise.all([
        this.attachmentService.listAttachments(ticket.id),
        this.slaService.resolveForTicket(
          ticket,
          this.lookup.ticketSeverityName(ticket.ticket_severity_id as unknown as number)
        ),
      ]);

      success(res, this.mapTicketDetail(ticket, attachments, slaStatus), 200);
    } catch (err: unknown) {
      handleError(res, err);
    }
  };

  listTickets = async (req: Request, res: Response): Promise<void> => {
    try {
      const actor = (req as AuthenticatedRequest).user;
      const query = validateOrThrow(listTicketsQuerySchema, req.query);

      const tickets = await this.ticketService.listTickets(
        {
          organizationId: query.organizationId as OrganizationId | undefined,
          ticketStatus: query.ticketStatus,
          assigneeId: query.assigneeId as UserId | undefined,
        },
        actor.id as UserId,
        { limit: query.limit, offset: query.offset }
      );

      // Batch-resolve SLA status for all tickets in two queries total
      const slaStatusMap = await this.slaService.resolveForTickets(
        tickets.map((t) => ({
          ticket: t,
          ticketSeverityName: this.lookup.ticketSeverityName(
            t.ticket_severity_id as unknown as number
          ),
        }))
      );

      const response: ListTicketsResponse = {
        tickets: tickets.map((t) =>
          this.mapTicketSummary(t, slaStatusMap.get(t.id as string) ?? null)
        ),
      };
      success(res, response, 200);
    } catch (err: unknown) {
      handleError(res, err);
    }
  };

  updateTicket = async (req: Request, res: Response): Promise<void> => {
    try {
      const actor = (req as AuthenticatedRequest).user;
      const body = validateOrThrow(updateTicketSchema, req.body);

      const ticket = await this.ticketService.updateTicket(
        req.params.ticketId as TicketId,
        {
          title: body.title,
          description: body.description,
          ticket_type_id: body.ticketType ? this.lookup.ticketTypeId(body.ticketType) : undefined,
          ticket_severity_id: body.ticketSeverity
            ? this.lookup.ticketSeverityId(body.ticketSeverity)
            : undefined,
          business_impact_id: body.businessImpact
            ? this.lookup.businessImpactId(body.businessImpact)
            : undefined,
          deadline: body.deadline ? new Date(body.deadline) : undefined,
          users_impacted: body.usersImpacted,
          ticket_status_id: body.ticketStatus
            ? this.lookup.ticketStatusId(body.ticketStatus)
            : undefined,
          assigned_to_user_id: body.assignedToUserId as UserId | null | undefined,
        },
        actor.id as UserId
      );

      success(res, this.mapTicket(ticket), 200);
    } catch (err: unknown) {
      handleError(res, err);
    }
  };

  assignTicket = async (req: Request, res: Response): Promise<void> => {
    try {
      const actor = (req as AuthenticatedRequest).user;
      const body = validateOrThrow(assignTicketSchema, req.body);

      const ticket = await this.ticketService.assignTicket(
        req.params.ticketId as TicketId,
        body.assigneeId as UserId,
        actor.id as UserId
      );

      success(res, this.mapTicket(ticket), 200);
    } catch (err: unknown) {
      handleError(res, err);
    }
  };

  resolveTicket = async (req: Request, res: Response): Promise<void> => {
    try {
      const actor = (req as AuthenticatedRequest).user;

      const ticket = await this.ticketService.resolveTicket(
        req.params.ticketId as TicketId,
        actor.id as UserId
      );

      success(res, this.mapTicket(ticket), 200);
    } catch (err: unknown) {
      handleError(res, err);
    }
  };

  deleteTicket = async (req: Request, res: Response): Promise<void> => {
    try {
      const actor = (req as AuthenticatedRequest).user;

      await this.ticketService.deleteTicket(req.params.ticketId as TicketId, actor.id as UserId);

      success(res, { message: 'Ticket deleted successfully' }, 200);
    } catch (err: unknown) {
      handleError(res, err);
    }
  };

  addComment = async (req: Request, res: Response): Promise<void> => {
    try {
      const actor = (req as AuthenticatedRequest).user;
      const body = validateOrThrow(addCommentSchema, req.body);

      const comment = await this.commentService.addComment(
        req.params.ticketId as TicketId,
        body.commentText,
        body.commentType,
        actor.id as UserId
      );

      success(res, this.mapComment(comment), 201);
    } catch (err: unknown) {
      handleError(res, err);
    }
  };

  getAttachmentUrl = async (req: Request, res: Response): Promise<void> => {
    try {
      const { attachmentId } = req.params;
      const url = await this.attachmentService.getAttachmentUrl(
        attachmentId as string,
        backEnv.ATTACHMENT_PRESIGN_EXPIRY_SECONDS
      );
      success(res, { url }, 200);
    } catch (err: unknown) {
      handleError(res, err);
    }
  };

  listComments = async (req: Request, res: Response): Promise<void> => {
    try {
      const actor = (req as AuthenticatedRequest).user;

      const comments = await this.commentService.listComments(
        req.params.ticketId as TicketId,
        actor.id as UserId
      );

      const response: ListCommentsResponse = { comments: comments.map((c) => this.mapComment(c)) };
      success(res, response, 200);
    } catch (err: unknown) {
      handleError(res, err);
    }
  };

  getSimilarTickets = async (req: Request, res: Response): Promise<void> => {
    try {
      const ticketId = req.params.ticketId as TicketId;
      const results = await this.similarityService.findSimilar(ticketId);

      const response: ListSimilarTicketsResponse = {
        similarTickets: results.map((r) => this.mapSimilarTicketResult(r)),
      };
      success(res, response, 200);
    } catch (err: unknown) {
      handleError(res, err);
    }
  };

  private mapTicket(ticket: Ticket): TicketResponse {
    return {
      id: ticket.id as string,
      title: ticket.title,
      description: ticket.description,
      organizationId: ticket.organization_id as string,
      creatorUserId: ticket.creator_user_id as string,
      assignedToUserId: ticket.assigned_to_user_id as string | null,
      resolvedByUserId: ticket.resolved_by_user_id as string | null,
      ticketType: this.lookup.ticketTypeName(ticket.ticket_type_id as unknown as number),
      ticketSeverity: this.lookup.ticketSeverityName(
        ticket.ticket_severity_id as unknown as number
      ),
      businessImpact: this.lookup.businessImpactName(
        ticket.business_impact_id as unknown as number
      ),
      ticketStatus: this.lookup.ticketStatusName(ticket.ticket_status_id as unknown as number),
      ticketPriority: this.lookup.ticketPriorityName(
        ticket.ticket_priority_id as unknown as number
      ),
      deadline: ticket.deadline.toISOString(),
      usersImpacted: ticket.users_impacted,
      createdAt: ticket.created_at.toISOString(),
      updatedAt: ticket.updated_at.toISOString(),
    };
  }

  private mapTicketSummary(
    ticket: TicketWithDetails,
    slaStatus: SlaStatusResponse | null
  ): TicketSummaryResponse {
    return {
      ...this.mapTicket(ticket),
      organizationName: ticket.organization_name,
      slaStatus,
    };
  }

  private mapTicketDetail(
    ticket: TicketWithDetails,
    attachments: TicketAttachment[],
    slaStatus: SlaStatusResponse | null
  ): TicketDetailResponse {
    return {
      ...this.mapTicket(ticket),
      organizationName: ticket.organization_name,
      attachments: attachments.map((a) => this.mapAttachment(a)),
      slaStatus,
    };
  }

  private mapAttachment(attachment: TicketAttachment): AttachmentResponse {
    return {
      id: attachment.id as unknown as string,
      ticketId: attachment.ticket_id as string,
      uploadedByUserId: attachment.uploaded_by_user_id as string,
      originalName: attachment.original_name,
      storageKey: attachment.storage_key,
      storageType: this.lookup.fileStorageTypeName(attachment.storage_type_id as unknown as number),
      mimeType: attachment.mime_type,
      sizeBytes: attachment.size_bytes,
      createdAt: attachment.created_at.toISOString(),
    };
  }

  private mapComment(comment: EnrichedComment): CommentResponse {
    return {
      id: comment.id as unknown as number,
      ticketId: comment.ticket_id as string,
      authorDisplayName: comment.author_display_name,
      commentText: comment.comment_text,
      commentType: this.lookup.commentTypeName(comment.comment_type_id as unknown as number),
      createdAt: comment.created_at.toISOString(),
      updatedAt: comment.updated_at.toISOString(),
    };
  }

  private mapSimilarQuote(quote: QuoteWithApproval): SimilarQuoteResponse {
    return {
      id: quote.id as unknown as string,
      version: quote.version,
      estimatedHoursMinimum: quote.estimated_hours_minimum,
      estimatedHoursMaximum: quote.estimated_hours_maximum,
      estimatedResolutionTime: quote.estimated_resolution_time,
      estimatedCost: quote.estimated_cost,
      finalCost: quote.final_cost,
      approvalStatus: quote.approval_status_name,
      createdAt: quote.created_at.toISOString(),
    };
  }

  private mapSimilarTicketResult(result: SimilarTicketResult): SimilarTicketResponse {
    return {
      ticket: this.mapTicket(result.ticket),
      quote: result.quote ? this.mapSimilarQuote(result.quote) : null,
      similarityScore: result.similarityScore,
    };
  }
}

function handleError(res: Response, err: unknown): void {
  if (!(err instanceof Error)) {
    error(res, 500, 'Internal server error');
    return;
  }

  if (err.name === 'TicketError' || err.name === 'QuoteError') {
    const e = err as Error & { statusCode: number };
    error(res, e.statusCode, e.message);
    return;
  }

  if (err.name === 'ForbiddenError') {
    const e = err as Error & { statusCode: number };
    error(res, e.statusCode, e.message);
    return;
  }

  if (err.name === 'StorageError') {
    const e = err as Error & { statusCode?: number };
    error(res, e.statusCode ?? 500, e.message);
    return;
  }

  if (err.name === 'ValidationError' || err.message.includes(':')) {
    error(res, 400, err.message);
    return;
  }

  console.error('Unhandled controller error:', err);
  error(res, 500, 'Internal server error');
}
