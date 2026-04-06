import type { QuoteApprovalsDAO, QuotesDAO } from '../../daos/children/quotes-domain.dao.js';
import type { UsersDAO } from '../../daos/children/users-domain.dao.js';
import type { RBACService } from '../rbac/rbac.service.js';
import type { QuoteApproval } from '../../database/types/tables.js';
import type { QuoteApprovalId, QuoteId, UserId } from '../../database/types/ids.js';
import type { InsertData, TransactionContext } from '../../daos/base/types.js';
import {
  AUTH_ROLES,
  PERMISSIONS,
  QUOTE_APPROVAL_STATUSES,
} from '../../../shared/constants/lookup-values.js';
import { ForbiddenError } from '../ticket/ticket.errors.js';
import { QUOTE_ERROR_MSGS, QuoteError } from './quote.errors.js';
import type { LookupResolver } from '../../lib/lookup-resolver.js';

export class QuoteApprovalService {
  private quotesDAO: QuotesDAO;
  private quoteApprovalsDAO: QuoteApprovalsDAO;
  private usersDAO: UsersDAO;
  private rbacService: RBACService;
  private lookup: LookupResolver;

  constructor(
    quotesDAO: QuotesDAO,
    quoteApprovalsDAO: QuoteApprovalsDAO,
    usersDAO: UsersDAO,
    rbacService: RBACService,
    lookup: LookupResolver
  ) {
    this.quotesDAO = quotesDAO;
    this.quoteApprovalsDAO = quoteApprovalsDAO;
    this.usersDAO = usersDAO;
    this.rbacService = rbacService;
    this.lookup = lookup;
  }

  /**
   * Submit a quote for approval by creating a PENDING QuoteApproval record
   * and linking it to the quote.
   * Requires QUOTES_CREATE permission (the submitter is the quote author).
   *
   * @param quoteId Quote to submit
   * @param actorId Actor submitting
   * @param options Optional transaction context
   * @returns Created QuoteApproval
   * @throws ForbiddenError if actor lacks permission
   * @throws QuoteError if quote not found
   */
  async submitForApproval(
    quoteId: QuoteId,
    actorId: UserId,
    options?: TransactionContext
  ): Promise<QuoteApproval> {
    const canCreate = await this.rbacService.hasPermission(
      actorId,
      PERMISSIONS.QUOTES_CREATE,
      options
    );
    if (!canCreate) throw new ForbiddenError(QUOTE_ERROR_MSGS.FORBIDDEN);

    const quote = await this.quotesDAO.getById(quoteId, options);
    if (!quote) throw new QuoteError(QUOTE_ERROR_MSGS.NOT_FOUND, 404);

    const actor = await this.usersDAO.getById(actorId, options);
    if (!actor) throw new QuoteError('Actor not found', 404);

    const actorWithRole = actor as typeof actor & { role?: { name: string } };

    const approval = await this.quoteApprovalsDAO.create(
      {
        approved_by_user_id: actorId,
        user_role: actorWithRole.role?.name ?? 'unknown',
        approval_status_id: this.lookup.quoteApprovalStatusId(QUOTE_APPROVAL_STATUSES.PENDING),
        comment: null,
        approved_at: null,
      } satisfies InsertData<QuoteApproval>,
      options
    );

    await this.quotesDAO.update(
      { id: quoteId },
      { quote_approval_id: approval.id as unknown as QuoteApprovalId },
      options
    );

    return approval;
  }

  /**
   * Approve a quote by updating its approval record to APPROVED.
   * Requires QUOTES_APPROVE permission.
   *
   * @param quoteId Quote to approve
   * @param actorId Actor approving
   * @param comment Optional approval comment
   * @param options Optional transaction context
   * @returns Updated QuoteApproval
   * @throws ForbiddenError if actor lacks permission
   * @throws QuoteError if quote not found or not in PENDING state
   */
  async approveQuote(
    quoteId: QuoteId,
    actorId: UserId,
    comment: string | null,
    options?: TransactionContext
  ): Promise<QuoteApproval> {
    const canApprove = await this.rbacService.hasPermission(
      actorId,
      PERMISSIONS.QUOTES_APPROVE,
      options
    );
    if (!canApprove) throw new ForbiddenError(QUOTE_ERROR_MSGS.FORBIDDEN);

    const quote = await this.quotesDAO.getById(quoteId, options);
    if (!quote) throw new QuoteError(QUOTE_ERROR_MSGS.NOT_FOUND, 404);
    if (!quote.quote_approval_id) throw new QuoteError(QUOTE_ERROR_MSGS.NOT_PENDING, 422);

    const approval = await this.quoteApprovalsDAO.getById(quote.quote_approval_id, options);
    if (!approval) throw new QuoteError(QUOTE_ERROR_MSGS.NOT_PENDING, 422);

    const approvedId = this.lookup.quoteApprovalStatusId(QUOTE_APPROVAL_STATUSES.APPROVED);
    const pendingId = this.lookup.quoteApprovalStatusId(QUOTE_APPROVAL_STATUSES.PENDING);

    if ((approval.approval_status_id as unknown as number) === (approvedId as unknown as number)) {
      throw new QuoteError(QUOTE_ERROR_MSGS.ALREADY_APPROVED, 422);
    }
    if ((approval.approval_status_id as unknown as number) !== (pendingId as unknown as number)) {
      throw new QuoteError(QUOTE_ERROR_MSGS.NOT_PENDING, 422);
    }

    await this.quoteApprovalsDAO.update(
      { id: quote.quote_approval_id },
      {
        approval_status_id: approvedId,
        approved_at: new Date(),
        comment,
      },
      options
    );

    const updated = await this.quoteApprovalsDAO.getById(quote.quote_approval_id, options);
    if (!updated) throw new QuoteError(QUOTE_ERROR_MSGS.NOT_FOUND, 404);
    return updated;
  }

  /**
   * Reject a quote by updating its approval record to REJECTED.
   * Requires QUOTES_REJECT permission.
   *
   * @param quoteId Quote to reject
   * @param comment Mandatory rejection reason
   * @param actorId Actor rejecting
   * @param options Optional transaction context
   * @returns Updated QuoteApproval
   * @throws ForbiddenError if actor lacks permission
   * @throws QuoteError if quote not found or not in PENDING state
   */
  async rejectQuote(
    quoteId: QuoteId,
    comment: string,
    actorId: UserId,
    options?: TransactionContext
  ): Promise<QuoteApproval> {
    const canReject = await this.rbacService.hasPermission(
      actorId,
      PERMISSIONS.QUOTES_REJECT,
      options
    );
    if (!canReject) throw new ForbiddenError(QUOTE_ERROR_MSGS.FORBIDDEN);

    const actor = await this.usersDAO.findWithRole(actorId, options);
    if (!actor) throw new QuoteError(QUOTE_ERROR_MSGS.USER_NOT_FOUND, 404);

    const rejectionStatus =
      actor.role.name === AUTH_ROLES.CUSTOMER
        ? QUOTE_APPROVAL_STATUSES.REJECTED_BY_CUSTOMER
        : QUOTE_APPROVAL_STATUSES.REJECTED_BY_MANAGER;

    const quote = await this.quotesDAO.getById(quoteId, options);
    if (!quote) throw new QuoteError(QUOTE_ERROR_MSGS.NOT_FOUND, 404);
    if (!quote.quote_approval_id) throw new QuoteError(QUOTE_ERROR_MSGS.NOT_PENDING, 422);

    const approval = await this.quoteApprovalsDAO.getById(quote.quote_approval_id, options);
    if (!approval) throw new QuoteError(QUOTE_ERROR_MSGS.NOT_PENDING, 422);

    const pendingId = this.lookup.quoteApprovalStatusId(QUOTE_APPROVAL_STATUSES.PENDING);
    if ((approval.approval_status_id as unknown as number) !== (pendingId as unknown as number)) {
      throw new QuoteError(QUOTE_ERROR_MSGS.NOT_PENDING, 422);
    }

    await this.quoteApprovalsDAO.update(
      { id: quote.quote_approval_id },
      {
        approval_status_id: this.lookup.quoteApprovalStatusId(rejectionStatus),
        comment,
        approved_at: new Date(),
      },
      options
    );

    const updated = await this.quoteApprovalsDAO.getById(quote.quote_approval_id, options);
    if (!updated) throw new QuoteError(QUOTE_ERROR_MSGS.NOT_FOUND, 404);
    return updated;
  }
}
