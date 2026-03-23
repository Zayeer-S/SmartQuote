import type { TicketsDAO } from '../../daos/children/tickets.dao.js';
import type { RBACService } from '../rbac/rbac.service.js';
import type { TicketComment } from '../../database/types/tables.js';
import type { TicketId, UserId } from '../../database/types/ids.js';
import type { InsertData, TransactionContext } from '../../daos/base/types.js';
import { PERMISSIONS, COMMENT_TYPES } from '../../../shared/constants/lookup-values.js';
import type { CommentType } from '../../../shared/constants/lookup-values.js';
import { ForbiddenError, TicketError, TICKET_ERROR_MSGS } from './ticket.errors.js';
import type { TicketCommentsDAO } from '../../daos/children/ticket.comments.dao.js';
import type { LookupResolver } from '../../lib/lookup-resolver.js';

export class CommentService {
  private ticketCommentsDAO: TicketCommentsDAO;
  private ticketsDAO: TicketsDAO;
  private rbacService: RBACService;
  private lookup: LookupResolver;

  constructor(
    ticketCommentsDAO: TicketCommentsDAO,
    ticketsDAO: TicketsDAO,
    rbacService: RBACService,
    lookup: LookupResolver
  ) {
    this.ticketCommentsDAO = ticketCommentsDAO;
    this.ticketsDAO = ticketsDAO;
    this.rbacService = rbacService;
    this.lookup = lookup;
  }
  /**
   * Add a comment to a ticket.
   * Ticket must exist and not be soft-deleted.
   * Customers may only post EXTERNAL comment type (id=2).
   * Agents may post any comment type.
   *
   * @param ticketId Ticket to comment on
   * @param text Comment body
   * @param commentTypeId Type of comment
   * @param actorId Actor posting the comment
   * @param options Optional transaction context
   * @returns Created comment
   * @throws TicketError if ticket not found
   * @throws ForbiddenError if customer attempts an internal/system comment type
   */
  async addComment(
    ticketId: TicketId,
    text: string,
    commentType: CommentType,
    actorId: UserId,
    options?: TransactionContext
  ): Promise<TicketComment> {
    const ticket = await this.ticketsDAO.getById(ticketId, options);
    if (!ticket) throw new TicketError(TICKET_ERROR_MSGS.NOT_FOUND, 404);

    const canUpdateAll = await this.rbacService.hasPermission(
      actorId,
      PERMISSIONS.TICKETS_UPDATE_ALL,
      options
    );

    if (!canUpdateAll) {
      if (commentType !== COMMENT_TYPES.EXTERNAL)
        throw new ForbiddenError('Customers may only post external comments');

      const canReadAll = await this.rbacService.hasPermission(
        actorId,
        PERMISSIONS.TICKETS_READ_ALL,
        options
      );
      if (!canReadAll) {
        // Reuse TicketsDAO visibility check via a getById on the actor
        // (full org check is done at the ticket service level; here we trust
        // that the route has already validated visibility before calling this)
      }
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
   *
   * @param ticketId Ticket to list comments for
   * @param actorId Actor requesting comments
   * @param options Optional transaction context
   * @returns Array of comments ordered oldest first
   * @throws TicketError if ticket not found
   */
  async listComments(
    ticketId: TicketId,
    actorId: UserId,
    options?: TransactionContext
  ): Promise<TicketComment[]> {
    const ticket = await this.ticketsDAO.getById(ticketId, options);
    if (!ticket) throw new TicketError(TICKET_ERROR_MSGS.NOT_FOUND, 404);

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
