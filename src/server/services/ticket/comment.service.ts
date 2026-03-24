import type { RBACService } from '../rbac/rbac.service.js';
import type { TicketService } from './ticket.service.js';
import type { TicketComment } from '../../database/types/tables.js';
import type { TicketId, UserId } from '../../database/types/ids.js';
import type { InsertData, TransactionContext } from '../../daos/base/types.js';
import { PERMISSIONS, COMMENT_TYPES } from '../../../shared/constants/lookup-values.js';
import type { CommentType } from '../../../shared/constants/lookup-values.js';
import { ForbiddenError } from './ticket.errors.js';
import type { TicketCommentsDAO } from '../../daos/children/ticket.comments.dao.js';
import type { LookupResolver } from '../../lib/lookup-resolver.js';

export class CommentService {
  private ticketCommentsDAO: TicketCommentsDAO;
  private ticketService: TicketService;
  private rbacService: RBACService;
  private lookup: LookupResolver;

  constructor(
    ticketCommentsDAO: TicketCommentsDAO,
    ticketService: TicketService,
    rbacService: RBACService,
    lookup: LookupResolver
  ) {
    this.ticketCommentsDAO = ticketCommentsDAO;
    this.ticketService = ticketService;
    this.rbacService = rbacService;
    this.lookup = lookup;
  }

  /**
   * Add a comment to a ticket.
   * Ticket must exist and be visible to the actor (ownership enforced via TicketService).
   * Customers may only post EXTERNAL comment type.
   * Agents may post any comment type.
   *
   * @param ticketId Ticket to comment on
   * @param text Comment body
   * @param commentType Type of comment
   * @param actorId Actor posting the comment
   * @param options Optional transaction context
   * @returns Created comment
   * @throws TicketError if ticket not found or not visible to actor
   * @throws ForbiddenError if customer attempts an internal/system comment type
   */
  async addComment(
    ticketId: TicketId,
    text: string,
    commentType: CommentType,
    actorId: UserId,
    options?: TransactionContext
  ): Promise<TicketComment> {
    // Enforces existence + org visibility in one call
    await this.ticketService.getTicket(ticketId, actorId, options);

    const canUpdateAll = await this.rbacService.hasPermission(
      actorId,
      PERMISSIONS.TICKETS_UPDATE_ALL,
      options
    );

    if (!canUpdateAll && commentType !== COMMENT_TYPES.EXTERNAL) {
      throw new ForbiddenError('Customers may only post external comments');
    }

    const commentTypeId = this.lookup.commentTypeId(commentType);

    return this.ticketCommentsDAO.create(
      {
        ticket_id: ticketId,
        user_id: actorId,
        comment_text: text,
        comment_type_id: commentTypeId,
      } satisfies InsertData<TicketComment>,
      options
    );
  }

  /**
   * List comments on a ticket.
   * Agents with TICKETS_UPDATE_ALL receive all comment types.
   * All other actors receive only EXTERNAL and SYSTEM comments.
   * Ticket visibility is enforced via TicketService before any comment data is returned.
   *
   * @param ticketId Ticket to list comments for
   * @param actorId Actor requesting comments
   * @param options Optional transaction context
   * @returns Array of comments ordered oldest first
   * @throws TicketError if ticket not found or not visible to actor
   */
  async listComments(
    ticketId: TicketId,
    actorId: UserId,
    options?: TransactionContext
  ): Promise<TicketComment[]> {
    // Enforces existence + org visibility in one call
    await this.ticketService.getTicket(ticketId, actorId, options);

    const canUpdateAll = await this.rbacService.hasPermission(
      actorId,
      PERMISSIONS.TICKETS_UPDATE_ALL,
      options
    );

    if (canUpdateAll) {
      return this.ticketCommentsDAO.findByTicket(ticketId, options);
    }

    const [external, system] = await Promise.all([
      this.ticketCommentsDAO.findByType(
        ticketId,
        this.lookup.commentTypeId(COMMENT_TYPES.EXTERNAL),
        options
      ),
      this.ticketCommentsDAO.findByType(
        ticketId,
        this.lookup.commentTypeId(COMMENT_TYPES.SYSTEM),
        options
      ),
    ]);

    return [...external, ...system].sort((a, b) => a.created_at.getTime() - b.created_at.getTime());
  }
}
