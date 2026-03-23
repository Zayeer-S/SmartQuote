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
  CommentResponse,
  ListCommentsResponse,
  ListTicketsResponse,
  TicketDetailResponse,
  TicketResponse,
} from '../../shared/contracts/ticket-contracts.js';
import type { UserId, TicketId } from '../database/types/ids.js';
import type { Ticket, TicketWithDetails, TicketComment } from '../database/types/tables.js';
import type { OrganizationId } from '../database/types/ids.js';
import type { TicketService } from '../services/ticket/ticket.service.js';
import type { CommentService } from '../services/ticket/comment.service.js';
import type { LookupResolver } from '../lib/lookup-resolver.js';

export class TicketController {
  private ticketService: TicketService;
  private commentService: CommentService;
  private lookup: LookupResolver;

  constructor(
    ticketService: TicketService,
    commentService: CommentService,
    lookup: LookupResolver
  ) {
    this.ticketService = ticketService;
    this.commentService = commentService;
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

  getTicket = async (req: Request, res: Response): Promise<void> => {
    try {
      const actor = (req as AuthenticatedRequest).user;
      const ticket = await this.ticketService.getTicket(
        req.params.ticketId as TicketId,
        actor.id as UserId
      );

      success(res, this.mapTicketDetail(ticket), 200);
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

      const response: ListTicketsResponse = {
        tickets: tickets.map((t) => this.mapTicketDetail(t)),
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

  private mapTicketDetail(ticket: TicketWithDetails): TicketDetailResponse {
    return {
      ...this.mapTicket(ticket),
      organizationName: ticket.organization_name,
    };
  }

  private mapComment(comment: TicketComment): CommentResponse {
    return {
      id: comment.id as unknown as number,
      ticketId: comment.ticket_id as string,
      userId: comment.user_id as string,
      commentText: comment.comment_text,
      commentType: this.lookup.commentTypeName(comment.comment_type_id as unknown as number),
      createdAt: comment.created_at.toISOString(),
      updatedAt: comment.updated_at.toISOString(),
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

  if (err.name === 'ValidationError' || err.message.includes(':')) {
    error(res, 400, err.message);
    return;
  }

  console.error('Unhandled controller error:', err);
  error(res, 500, 'Internal server error');
}
