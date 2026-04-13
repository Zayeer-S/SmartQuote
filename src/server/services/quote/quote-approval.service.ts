import type { QuoteApprovalsDAO, QuotesDAO } from '../../daos/children/quotes-domain.dao.js';
import type { UsersDAO } from '../../daos/children/users-domain.dao.js';
import type { RBACService } from '../rbac/rbac.service.js';
import type { QuoteApproval } from '../../database/types/tables.js';
import type { QuoteApprovalId, QuoteId, UserId } from '../../database/types/ids.js';
import type { InsertData, TransactionContext } from '../../daos/base/types.js';
import { PERMISSIONS, QUOTE_APPROVAL_STATUSES } from '../../../shared/constants/lookup-values.js';
import type { QuoteApprovalStatus } from '../../../shared/constants/lookup-values.js';
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
   * Submit a quote for manager review.
   * Creates a QuoteApproval record with status APPROVED_BY_AGENT and links it to the quote.
   * Only valid when the quote has no existing approval record (quote_approval_id IS NULL).
   * Requires QUOTES_AGENT_APPROVE.
   *
   * @param quoteId Quote to submit
   * @param actorId Actor submitting
   * @param options Optional transaction context
   * @returns Created QuoteApproval
   * @throws ForbiddenError if actor lacks QUOTES_AGENT_APPROVE
   * @throws QuoteError if quote not found or already submitted
   */
  async submitForApproval(
    quoteId: QuoteId,
    actorId: UserId,
    options?: TransactionContext
  ): Promise<QuoteApproval> {
    const canSubmit = await this.rbacService.hasPermission(
      actorId,
      PERMISSIONS.QUOTES_AGENT_APPROVE,
      options
    );
    if (!canSubmit) throw new ForbiddenError(QUOTE_ERROR_MSGS.FORBIDDEN);

    const quote = await this.quotesDAO.getById(quoteId, options);
    if (!quote) throw new QuoteError(QUOTE_ERROR_MSGS.NOT_FOUND, 404);
    if (quote.quote_approval_id !== null) {
      throw new QuoteError(QUOTE_ERROR_MSGS.WRONG_STAGE, 422);
    }

    const actor = await this.usersDAO.getById(actorId, options);
    if (!actor) throw new QuoteError(QUOTE_ERROR_MSGS.USER_NOT_FOUND, 404);

    const actorWithRole = actor as typeof actor & { role?: { name: string } };

    const approval = await this.quoteApprovalsDAO.create(
      {
        approved_by_user_id: actorId,
        user_role: actorWithRole.role?.name ?? 'unknown',
        approval_status_id: this.lookup.quoteApprovalStatusId(
          QUOTE_APPROVAL_STATUSES.APPROVED_BY_AGENT
        ),
        comment: null,
        approved_at: new Date(),
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
   * Manager approves a submitted quote (APPROVED_BY_AGENT -> APPROVED_BY_MANAGER).
   * After this the quote becomes visible to the customer.
   * Requires QUOTES_MANAGER_APPROVE.
   *
   * @param quoteId Quote to approve
   * @param actorId Actor approving
   * @param comment Optional comment
   * @param options Optional transaction context
   * @returns Updated QuoteApproval
   * @throws ForbiddenError if actor lacks QUOTES_MANAGER_APPROVE
   * @throws QuoteError if quote not found, not submitted, or at wrong stage
   */
  async managerApprove(
    quoteId: QuoteId,
    actorId: UserId,
    comment: string | null,
    options?: TransactionContext
  ): Promise<QuoteApproval> {
    const canApprove = await this.rbacService.hasPermission(
      actorId,
      PERMISSIONS.QUOTES_MANAGER_APPROVE,
      options
    );
    if (!canApprove) throw new ForbiddenError(QUOTE_ERROR_MSGS.FORBIDDEN);

    const approval = await this.resolveApproval(quoteId, options);
    this.assertStatus(approval, [QUOTE_APPROVAL_STATUSES.APPROVED_BY_AGENT]);

    return this.updateApproval(
      approval.id as unknown as QuoteApprovalId,
      QUOTE_APPROVAL_STATUSES.APPROVED_BY_MANAGER,
      comment,
      options
    );
  }

  /**
   * Manager rejects a submitted quote (APPROVED_BY_AGENT -> REJECTED_BY_MANAGER).
   * Terminal state -- agent must revise the quote and resubmit.
   * Requires QUOTES_MANAGER_REJECT.
   *
   * @param quoteId Quote to reject
   * @param actorId Actor rejecting
   * @param comment Mandatory rejection reason
   * @param options Optional transaction context
   * @returns Updated QuoteApproval
   * @throws ForbiddenError if actor lacks QUOTES_MANAGER_REJECT
   * @throws QuoteError if quote not found, not submitted, or at wrong stage
   */
  async managerReject(
    quoteId: QuoteId,
    actorId: UserId,
    comment: string,
    options?: TransactionContext
  ): Promise<QuoteApproval> {
    const canReject = await this.rbacService.hasPermission(
      actorId,
      PERMISSIONS.QUOTES_MANAGER_REJECT,
      options
    );
    if (!canReject) throw new ForbiddenError(QUOTE_ERROR_MSGS.FORBIDDEN);

    const approval = await this.resolveApproval(quoteId, options);
    this.assertStatus(approval, [QUOTE_APPROVAL_STATUSES.APPROVED_BY_AGENT]);

    return this.updateApproval(
      approval.id as unknown as QuoteApprovalId,
      QUOTE_APPROVAL_STATUSES.REJECTED_BY_MANAGER,
      comment,
      options
    );
  }

  /**
   * Admin bypasses the agent + manager approval steps entirely
   * (APPROVED_BY_AGENT -> APPROVED_BY_ADMIN).
   * Quote becomes visible to the customer immediately.
   * Requires QUOTES_ADMIN_APPROVE.
   *
   * @param quoteId Quote to approve
   * @param actorId Actor approving
   * @param comment Optional comment
   * @param options Optional transaction context
   * @returns Updated QuoteApproval
   * @throws ForbiddenError if actor lacks QUOTES_ADMIN_APPROVE
   * @throws QuoteError if quote not found, not submitted, or at wrong stage
   */
  async adminApprove(
    quoteId: QuoteId,
    actorId: UserId,
    comment: string | null,
    options?: TransactionContext
  ): Promise<QuoteApproval> {
    const canApprove = await this.rbacService.hasPermission(
      actorId,
      PERMISSIONS.QUOTES_ADMIN_APPROVE,
      options
    );
    if (!canApprove) throw new ForbiddenError(QUOTE_ERROR_MSGS.FORBIDDEN);

    const approval = await this.resolveApproval(quoteId, options);
    this.assertStatus(approval, [QUOTE_APPROVAL_STATUSES.APPROVED_BY_AGENT]);

    return this.updateApproval(
      approval.id as unknown as QuoteApprovalId,
      QUOTE_APPROVAL_STATUSES.APPROVED_BY_ADMIN,
      comment,
      options
    );
  }

  /**
   * Customer accepts a quote that has cleared employee approval
   * (APPROVED_BY_MANAGER | APPROVED_BY_ADMIN -> APPROVED_BY_CUSTOMER).
   * Terminal state -- quote is fully accepted.
   * Requires QUOTES_CUSTOMER_APPROVE.
   *
   * @param quoteId Quote to accept
   * @param actorId Actor accepting
   * @param comment Optional comment
   * @param options Optional transaction context
   * @returns Updated QuoteApproval
   * @throws ForbiddenError if actor lacks QUOTES_CUSTOMER_APPROVE
   * @throws QuoteError if quote not found, not submitted, or at wrong stage
   */
  async customerApprove(
    quoteId: QuoteId,
    actorId: UserId,
    comment: string | null,
    options?: TransactionContext
  ): Promise<QuoteApproval> {
    const canApprove = await this.rbacService.hasPermission(
      actorId,
      PERMISSIONS.QUOTES_CUSTOMER_APPROVE,
      options
    );
    if (!canApprove) throw new ForbiddenError(QUOTE_ERROR_MSGS.FORBIDDEN);

    const approval = await this.resolveApproval(quoteId, options);
    this.assertStatus(approval, [
      QUOTE_APPROVAL_STATUSES.APPROVED_BY_MANAGER,
      QUOTE_APPROVAL_STATUSES.APPROVED_BY_ADMIN,
    ]);

    return this.updateApproval(
      approval.id as unknown as QuoteApprovalId,
      QUOTE_APPROVAL_STATUSES.APPROVED_BY_CUSTOMER,
      comment,
      options
    );
  }

  /**
   * Customer rejects a quote that has cleared employee approval
   * (APPROVED_BY_MANAGER | APPROVED_BY_ADMIN -> REJECTED_BY_CUSTOMER).
   * Terminal state -- agent must revise the quote and resubmit.
   * Requires QUOTES_CUSTOMER_REJECT.
   *
   * @param quoteId Quote to reject
   * @param actorId Actor rejecting
   * @param comment Mandatory rejection reason
   * @param options Optional transaction context
   * @returns Updated QuoteApproval
   * @throws ForbiddenError if actor lacks QUOTES_CUSTOMER_REJECT
   * @throws QuoteError if quote not found, not submitted, or at wrong stage
   */
  async customerReject(
    quoteId: QuoteId,
    actorId: UserId,
    comment: string,
    options?: TransactionContext
  ): Promise<QuoteApproval> {
    const canReject = await this.rbacService.hasPermission(
      actorId,
      PERMISSIONS.QUOTES_CUSTOMER_REJECT,
      options
    );
    if (!canReject) throw new ForbiddenError(QUOTE_ERROR_MSGS.FORBIDDEN);

    const approval = await this.resolveApproval(quoteId, options);
    this.assertStatus(approval, [
      QUOTE_APPROVAL_STATUSES.APPROVED_BY_MANAGER,
      QUOTE_APPROVAL_STATUSES.APPROVED_BY_ADMIN,
    ]);

    return this.updateApproval(
      approval.id as unknown as QuoteApprovalId,
      QUOTE_APPROVAL_STATUSES.REJECTED_BY_CUSTOMER,
      comment,
      options
    );
  }

  /**
   * Fetch and null-check the approval record for a quote.
   * Throws if the quote does not exist or has not been submitted yet.
   */
  private async resolveApproval(
    quoteId: QuoteId,
    options?: TransactionContext
  ): Promise<QuoteApproval> {
    const quote = await this.quotesDAO.getById(quoteId, options);
    if (!quote) throw new QuoteError(QUOTE_ERROR_MSGS.NOT_FOUND, 404);
    if (quote.quote_approval_id === null) {
      throw new QuoteError(QUOTE_ERROR_MSGS.NOT_SUBMITTED, 422);
    }

    const approval = await this.quoteApprovalsDAO.getById(quote.quote_approval_id, options);
    if (!approval) throw new QuoteError(QUOTE_ERROR_MSGS.NOT_FOUND, 404);

    return approval;
  }

  /**
   * Assert the approval record is at one of the expected statuses.
   * Throws WRONG_STAGE (422) if not.
   */
  private assertStatus(approval: QuoteApproval, expected: QuoteApprovalStatus[]): void {
    const currentId = approval.approval_status_id as unknown as number;
    const match = expected.some(
      (s) => (this.lookup.quoteApprovalStatusId(s) as unknown as number) === currentId
    );
    if (!match) throw new QuoteError(QUOTE_ERROR_MSGS.WRONG_STAGE, 422);
  }

  /**
   * Apply a status transition to an approval record and return the refreshed row.
   */
  private async updateApproval(
    approvalId: QuoteApprovalId,
    status: QuoteApprovalStatus,
    comment: string | null,
    options?: TransactionContext
  ): Promise<QuoteApproval> {
    await this.quoteApprovalsDAO.update(
      { id: approvalId },
      {
        approval_status_id: this.lookup.quoteApprovalStatusId(status),
        approved_at: new Date(),
        comment,
      },
      options
    );

    const updated = await this.quoteApprovalsDAO.getById(approvalId, options);
    if (!updated) throw new QuoteError(QUOTE_ERROR_MSGS.NOT_FOUND, 404);
    return updated;
  }
}
