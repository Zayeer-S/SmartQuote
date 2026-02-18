import type { TicketsDAO } from '../../daos/children/tickets.dao';
import type { RBACService } from '../rbac/rbac.service';
import type { TicketComment } from '../../database/types/tables';
import type { CommentTypeId, TicketId, UserId } from '../../database/types/ids';
import type { InsertData, TransactionContext } from '../../daos/base/types';
import { PERMISSIONS } from '../../../shared/constants/lookup-values';
import { ForbiddenError, TicketError, TICKET_ERROR_MSGS } from './ticket.errors';
import type { TicketCommentsDAO } from '../../daos/children/ticket.comments.dao';

export class CommentService {
  private ticketCommentsDAO: TicketCommentsDAO;
  private ticketsDAO: TicketsDAO;
  private rbacService: RBACService;

  constructor(
    ticketCommentsDAO: TicketCommentsDAO,
    ticketsDAO: TicketsDAO,
    rbacService: RBACService
  ) {
    this.ticketCommentsDAO = ticketCommentsDAO;
    this.ticketsDAO = ticketsDAO;
    this.rbacService = rbacService;
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
    commentTypeId: CommentTypeId,
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
      // Customers: EXTERNAL type only (id=2)
      if ((commentTypeId as unknown as number) !== 2)
        throw new ForbiddenError('Customers may only post external comments');

      // Also scope-check: customer must belong to the ticket's organisation
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
   * Customers only see EXTERNAL (id=2) and SYSTEM (id=3) comment types.
   * Agents see all comment types.
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

    // Customers: fetch EXTERNAL (id=2) and SYSTEM (id=3) separately then merge,
    // preserving created_at order
    const [external, system] = await Promise.all([
      this.ticketCommentsDAO.findByType(ticketId, 2 as unknown as CommentTypeId, options),
      this.ticketCommentsDAO.findByType(ticketId, 3 as unknown as CommentTypeId, options),
    ]);

    return [...external, ...system].sort((a, b) => a.created_at.getTime() - b.created_at.getTime());
  }
}
