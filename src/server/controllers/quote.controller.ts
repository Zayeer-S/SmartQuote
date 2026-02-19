import type { Request, Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.middleware';
import { validateOrThrow } from '../validators/validation-utils';
import { success, error } from '../lib/respond';
import type {
  UserId,
  QuoteId,
  TicketId,
  QuoteEffortLevelId,
  QuoteConfidenceId,
} from '../database/types/ids';
import type {
  Quote,
  QuoteApproval,
  QuoteDetailRevision,
  QuoteWithApproval,
} from '../database/types/tables';
import type { QuoteService } from '../services/quote/quote.service';
import type { QuoteEngineService } from '../services/quote/quote.engine.service';
import {
  approveQuoteSchema,
  createManualQuoteSchema,
  rejectQuoteSchema,
  updateQuoteSchema,
} from '../validators/quote.validator';
import type {
  ListQuotesResponse,
  ListRevisionsResponse,
  QuoteApprovalResponse,
  QuoteResponse,
  QuoteRevisionResponse,
  QuoteWithApprovalResponse,
} from '../../shared/contracts/quote-contracts';

export class QuoteController {
  private quoteService: QuoteService;
  private quoteEngineService: QuoteEngineService;

  constructor(quoteService: QuoteService, quoteEngineService: QuoteEngineService) {
    this.quoteService = quoteService;
    this.quoteEngineService = quoteEngineService;
  }

  generateQuote = async (req: Request, res: Response): Promise<void> => {
    try {
      const actor = (req as AuthenticatedRequest).user;

      const quote = await this.quoteEngineService.generateQuote(
        req.params.ticketId as TicketId,
        actor.id as UserId
      );

      success(res, mapQuote(quote), 201);
    } catch (err: unknown) {
      handleError(res, err);
    }
  };

  createManualQuote = async (req: Request, res: Response): Promise<void> => {
    try {
      const actor = (req as AuthenticatedRequest).user;
      const body = validateOrThrow(createManualQuoteSchema, req.body);

      const quote = await this.quoteService.createManualQuote(
        req.params.ticketId as TicketId,
        {
          estimated_hours_minimum: body.estimatedHoursMinimum,
          estimated_hours_maximum: body.estimatedHoursMaximum,
          hourly_rate: body.hourlyRate,
          fixed_cost: body.fixedCost,
          quote_effort_level_id: body.quoteEffortLevelId as QuoteEffortLevelId,
          quote_confidence_level_id: body.quoteConfidenceLevelId as QuoteConfidenceId | null,
        },
        actor.id as UserId
      );

      success(res, mapQuote(quote), 201);
    } catch (err: unknown) {
      handleError(res, err);
    }
  };

  getQuote = async (req: Request, res: Response): Promise<void> => {
    try {
      const actor = (req as AuthenticatedRequest).user;

      const quote = await this.quoteService.getQuote(
        req.params.quoteId as QuoteId,
        actor.id as UserId
      );

      success(res, mapQuoteWithApproval(quote), 200);
    } catch (err: unknown) {
      handleError(res, err);
    }
  };

  listQuotes = async (req: Request, res: Response): Promise<void> => {
    try {
      const actor = (req as AuthenticatedRequest).user;

      const quotes = await this.quoteService.listQuotesForTicket(
        req.params.ticketId as TicketId,
        actor.id as UserId
      );

      const response: ListQuotesResponse = { quotes: quotes.map(mapQuote) };
      success(res, response, 200);
    } catch (err: unknown) {
      handleError(res, err);
    }
  };

  updateQuote = async (req: Request, res: Response): Promise<void> => {
    try {
      const actor = (req as AuthenticatedRequest).user;
      const body = validateOrThrow(updateQuoteSchema, req.body);

      const quote = await this.quoteService.updateQuote(
        req.params.quoteId as QuoteId,
        {
          estimated_hours_minimum: body.estimatedHoursMinimum,
          estimated_hours_maximum: body.estimatedHoursMaximum,
          hourly_rate: body.hourlyRate,
          fixed_cost: body.fixedCost,
          quote_effort_level_id: body.quoteEffortLevelId as QuoteEffortLevelId | undefined,
          quote_confidence_level_id: body.quoteConfidenceLevelId as
            | QuoteConfidenceId
            | null
            | undefined,
        },
        body.reason,
        actor.id as UserId
      );

      success(res, mapQuote(quote), 200);
    } catch (err: unknown) {
      handleError(res, err);
    }
  };

  submitForApproval = async (req: Request, res: Response): Promise<void> => {
    try {
      const actor = (req as AuthenticatedRequest).user;

      const approval = await this.quoteService.submitForApproval(
        req.params.quoteId as QuoteId,
        actor.id as UserId
      );

      success(res, mapApproval(approval), 201);
    } catch (err: unknown) {
      handleError(res, err);
    }
  };

  approveQuote = async (req: Request, res: Response): Promise<void> => {
    try {
      const actor = (req as AuthenticatedRequest).user;
      const body = validateOrThrow(approveQuoteSchema, req.body);

      const approval = await this.quoteService.approveQuote(
        req.params.quoteId as QuoteId,
        actor.id as UserId,
        body.comment ?? null
      );

      success(res, mapApproval(approval), 200);
    } catch (err: unknown) {
      handleError(res, err);
    }
  };

  rejectQuote = async (req: Request, res: Response): Promise<void> => {
    try {
      const actor = (req as AuthenticatedRequest).user;
      const body = validateOrThrow(rejectQuoteSchema, req.body);

      const approval = await this.quoteService.rejectQuote(
        req.params.quoteId as QuoteId,
        body.comment,
        actor.id as UserId
      );

      success(res, mapApproval(approval), 200);
    } catch (err: unknown) {
      handleError(res, err);
    }
  };

  getRevisionHistory = async (req: Request, res: Response): Promise<void> => {
    try {
      const actor = (req as AuthenticatedRequest).user;

      const revisions = await this.quoteService.getRevisionHistory(
        req.params.quoteId as QuoteId,
        actor.id as UserId
      );

      const response: ListRevisionsResponse = { revisions: revisions.map(mapRevision) };
      success(res, response, 200);
    } catch (err: unknown) {
      handleError(res, err);
    }
  };
}

function mapQuote(quote: Quote): QuoteResponse {
  return {
    id: quote.id as string,
    ticketId: quote.ticket_id as string,
    version: quote.version,
    estimatedHoursMinimum: quote.estimated_hours_minimum,
    estimatedHoursMaximum: quote.estimated_hours_maximum,
    estimatedResolutionTime: quote.estimated_resolution_time,
    hourlyRate: quote.hourly_rate,
    estimatedCost: quote.estimated_cost,
    fixedCost: quote.fixed_cost,
    finalCost: quote.final_cost,
    quoteConfidenceLevelId: quote.quote_confidence_level_id as number | null,
    quoteApprovalId: quote.quote_approval_id as number | null,
    suggestedTicketPriorityId: quote.suggested_ticket_priority_id as unknown as number,
    quoteEffortLevelId: quote.quote_effort_level_id as unknown as number,
    quoteCreatorId: quote.quote_creator_id as unknown as number,
    createdAt: quote.created_at.toISOString(),
    updatedAt: quote.updated_at.toISOString(),
  };
}

function mapQuoteWithApproval(quote: QuoteWithApproval): QuoteWithApprovalResponse {
  return {
    ...mapQuote(quote),
    approvalStatusName: quote.approval_status_name,
    approvalComment: quote.approval_comment,
    approvedAt: quote.approved_at?.toISOString() ?? null,
    approvedByUserId: quote.approved_by_user_id as string | null,
  };
}

function mapApproval(approval: QuoteApproval): QuoteApprovalResponse {
  return {
    id: approval.id as unknown as number,
    approvedByUserId: approval.approved_by_user_id as string,
    userRole: approval.user_role,
    approvalStatusId: approval.approval_status_id as unknown as number,
    comment: approval.comment,
    approvedAt: approval.approved_at?.toISOString() ?? null,
    createdAt: approval.created_at.toISOString(),
    updatedAt: approval.updated_at.toISOString(),
  };
}

function mapRevision(revision: QuoteDetailRevision): QuoteRevisionResponse {
  return {
    id: revision.id as unknown as number,
    quoteId: revision.quote_id as string,
    changedByUserId: revision.changed_by_user_id as string,
    fieldName: revision.field_name,
    oldValue: revision.old_value,
    newValue: revision.new_value,
    reason: revision.reason,
    createdAt: revision.created_at.toISOString(),
  };
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
