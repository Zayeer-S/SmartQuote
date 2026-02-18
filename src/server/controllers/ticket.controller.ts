import type { Request, Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.middleware';
import { validateOrThrow } from '../validators/validation-utils';
import {
  addCommentSchema,
  assignTicketSchema,
  createTicketSchema,
  listTicketsQuerySchema,
  updateTicketSchema,
} from '../validators/ticket.validator';
import { success, error } from '../lib/respond';
import type {
  CommentResponse,
  ListCommentsResponse,
  ListTicketsResponse,
  TicketDetailResponse,
  TicketResponse,
} from '../../shared/contracts/ticket-contracts';
import type {
  UserId,
  TicketId,
  CommentTypeId,
  TicketTypeId,
  TicketSeverityId,
  BusinessImpactId,
  TicketPriorityId,
} from '../database/types/ids';
import type { Ticket, TicketWithDetails, TicketComment } from '../database/types/tables';
import type { OrganizationId, TicketStatusId } from '../database/types/ids';
import type { TicketService } from '../services/ticket/ticket.service';
import type { CommentService } from '../services/ticket/comment.service';

export class TicketController {
  private ticketService: TicketService;
  private commentService: CommentService;

  constructor(ticketService: TicketService, commentService: CommentService) {
    this.ticketService = ticketService;
    this.commentService = commentService;
  }

  // ─── Tickets ───────────────────────────────────────────────────────────────

  createTicket = async (req: Request, res: Response): Promise<void> => {
    try {
      const actor = (req as AuthenticatedRequest).user;
      const body = validateOrThrow(createTicketSchema, req.body);

      const ticket = await this.ticketService.createTicket(
        {
          title: body.title,
          description: body.description,
          ticket_type_id: body.ticketTypeId as TicketTypeId,
          ticket_severity_id: body.ticketSeverityId as TicketSeverityId,
          business_impact_id: body.businessImpactId as BusinessImpactId,
          ticket_priority_id: body.ticketPriorityId as TicketPriorityId,
          deadline: new Date(body.deadline),
          users_impacted: body.usersImpacted,
        },
        actor.id as UserId
      );

      success(res, mapTicket(ticket), 201);
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

      success(res, mapTicketDetail(ticket), 200);
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
          statusId: query.statusId as TicketStatusId | undefined,
          assigneeId: query.assigneeId as UserId | undefined,
        },
        actor.id as UserId,
        { limit: query.limit, offset: query.offset }
      );

      const response: ListTicketsResponse = { tickets: tickets.map(mapTicket) };
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
          ticket_type_id: body.ticketTypeId as TicketTypeId,
          ticket_severity_id: body.ticketSeverityId as TicketSeverityId,
          business_impact_id: body.businessImpactId as BusinessImpactId,
          deadline: body.deadline ? new Date(body.deadline) : undefined,
          users_impacted: body.usersImpacted,
          ticket_status_id: body.ticketStatusId as Ticket['ticket_status_id'] | undefined,
          assigned_to_user_id: body.assignedToUserId as UserId | null | undefined,
        },
        actor.id as UserId
      );

      success(res, mapTicket(ticket), 200);
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

      success(res, mapTicket(ticket), 200);
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

      success(res, mapTicket(ticket), 200);
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

  // ─── Comments ──────────────────────────────────────────────────────────────

  addComment = async (req: Request, res: Response): Promise<void> => {
    try {
      const actor = (req as AuthenticatedRequest).user;
      const body = validateOrThrow(addCommentSchema, req.body);

      const comment = await this.commentService.addComment(
        req.params.ticketId as TicketId,
        body.commentText,
        body.commentTypeId as CommentTypeId,
        actor.id as UserId
      );

      success(res, mapComment(comment), 201);
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

      const response: ListCommentsResponse = { comments: comments.map(mapComment) };
      success(res, response, 200);
    } catch (err: unknown) {
      handleError(res, err);
    }
  };
}

// ─── Response Mappers ─────────────────────────────────────────────────────────

function mapTicket(ticket: Ticket): TicketResponse {
  return {
    id: ticket.id as string,
    title: ticket.title,
    description: ticket.description,
    organizationId: ticket.organization_id as string,
    creatorUserId: ticket.creator_user_id as string,
    assignedToUserId: ticket.assigned_to_user_id as string | null,
    resolvedByUserId: ticket.resolved_by_user_id as string | null,
    ticketTypeId: ticket.ticket_type_id as unknown as number,
    ticketSeverityId: ticket.ticket_severity_id as unknown as number,
    businessImpactId: ticket.business_impact_id as unknown as number,
    ticketStatusId: ticket.ticket_status_id as unknown as number,
    ticketPriorityId: ticket.ticket_priority_id as unknown as number,
    deadline: ticket.deadline.toISOString(),
    usersImpacted: ticket.users_impacted,
    createdAt: ticket.created_at.toISOString(),
    updatedAt: ticket.updated_at.toISOString(),
  };
}

function mapTicketDetail(ticket: TicketWithDetails): TicketDetailResponse {
  return {
    ...mapTicket(ticket),
    ticketTypeName: ticket.ticket_type_name,
    ticketSeverityName: ticket.ticket_severity_name,
    businessImpactName: ticket.business_impact_name,
    ticketStatusName: ticket.ticket_status_name,
    ticketPriorityName: ticket.ticket_priority_name,
    organizationName: ticket.organization_name,
  };
}

function mapComment(comment: TicketComment): CommentResponse {
  return {
    id: comment.id as unknown as number,
    ticketId: comment.ticket_id as string,
    userId: comment.user_id as string,
    commentText: comment.comment_text,
    commentTypeId: comment.comment_type_id as unknown as number,
    createdAt: comment.created_at.toISOString(),
    updatedAt: comment.updated_at.toISOString(),
  };
}

// ─── Shared Error Handler ─────────────────────────────────────────────────────

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
