import type { RBACService } from '../rbac/rbac.service.js';
import type { TicketService } from './ticket.service.js';
import type { TicketComment } from '../../database/types/tables.js';
import type { TicketId, UserId } from '../../database/types/ids.js';
import type { InsertData, TransactionContext } from '../../daos/base/types.js';
import { PERMISSIONS, COMMENT_TYPES } from '../../../shared/constants/lookup-values.js';
import type { CommentType } from '../../../shared/constants/lookup-values.js';
import { ForbiddenError } from './ticket.errors.js';
import type { TicketCommentsDAO } from '../../daos/children/ticket.comments.dao.js';
import type { UsersDAO } from '../../daos/children/users.dao.js';
import type { LookupResolver } from '../../lib/lookup-resolver.js';

export interface EnrichedComment extends TicketComment {
  author_display_name: string;
}

export class CommentService {
  private ticketCommentsDAO: TicketCommentsDAO;
  private usersDAO: UsersDAO;
  private ticketService: TicketService;
  private rbacService: RBACService;
  private lookup: LookupResolver;

  constructor(
    ticketCommentsDAO: TicketCommentsDAO,
    usersDAO: UsersDAO,
    ticketService: TicketService,
    rbacService: RBACService,
    lookup: LookupResolver
  ) {
    this.ticketCommentsDAO = ticketCommentsDAO;
    this.usersDAO = usersDAO;
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
   * @returns Created comment enriched with author display name
   * @throws TicketError if ticket not found or not visible to actor
   * @throws ForbiddenError if customer attempts an internal/system comment type
   */
  async addComment(
    ticketId: TicketId,
    text: string,
    commentType: CommentType,
    actorId: UserId,
    options?: TransactionContext
  ): Promise<EnrichedComment> {
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

    const comment = await this.ticketCommentsDAO.create(
      {
        ticket_id: ticketId,
        user_id: actorId,
        comment_text: text,
        comment_type_id: commentTypeId,
      } satisfies InsertData<TicketComment>,
      options
    );

    return this.enrichOne(comment, options);
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
   * @returns Array of enriched comments ordered oldest first
   * @throws TicketError if ticket not found or not visible to actor
   */
  async listComments(
    ticketId: TicketId,
    actorId: UserId,
    options?: TransactionContext
  ): Promise<EnrichedComment[]> {
    await this.ticketService.getTicket(ticketId, actorId, options);

    const canUpdateAll = await this.rbacService.hasPermission(
      actorId,
      PERMISSIONS.TICKETS_UPDATE_ALL,
      options
    );

    let comments: TicketComment[];

    if (canUpdateAll) {
      comments = await this.ticketCommentsDAO.findByTicket(ticketId, options);
    } else {
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
      comments = [...external, ...system].sort(
        (a, b) => a.created_at.getTime() - b.created_at.getTime()
      );
    }

    return this.enrichMany(comments, options);
  }

  /** Resolve author display names for a batch of comments in two queries. */
  private async enrichMany(
    comments: TicketComment[],
    options?: TransactionContext
  ): Promise<EnrichedComment[]> {
    if (comments.length === 0) return [];

    const uniqueUserIds = [...new Set(comments.map((c) => c.user_id))] as UserId[];
    const users = await this.usersDAO.getByManyIds(uniqueUserIds, options);

    const nameMap = new Map<string, string>();
    for (const user of users) {
      const parts = [user.first_name, user.middle_name, user.last_name].filter(Boolean);
      nameMap.set(user.id as string, parts.join(' '));
    }

    return comments.map((c) => ({
      ...c,
      author_display_name: nameMap.get(c.user_id as string) ?? 'Unknown',
    }));
  }

  /** Resolve author display name for a single comment. */
  private async enrichOne(
    comment: TicketComment,
    options?: TransactionContext
  ): Promise<EnrichedComment> {
    const [enriched] = await this.enrichMany([comment], options);
    // enrichMany always returns one entry when given one

    return enriched;
  }
}
