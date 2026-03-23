import type { Knex } from 'knex';
import { TicketsDAO } from '../daos/children/tickets.dao.js';
import { TicketCommentsDAO } from '../daos/children/ticket.comments.dao.js';
import { TicketAttachmentsDAO } from '../daos/children/ticket.attachments.dao.js';
import { UsersDAO } from '../daos/children/users.dao.js';
import { TicketService } from '../services/ticket/ticket.service.js';
import { CommentService } from '../services/ticket/comment.service.js';
import { TicketController } from '../controllers/ticket.controller.js';
import { RBACService } from '../services/rbac/rbac.service.js';
import { LookupResolver } from '../lib/lookup-resolver.js';

export class TicketContainer {
  public readonly ticketsDAO: TicketsDAO;
  public readonly ticketCommentsDAO: TicketCommentsDAO;
  public readonly ticketAttachmentsDAO: TicketAttachmentsDAO;
  public readonly usersDAO: UsersDAO;

  public readonly ticketService: TicketService;
  public readonly commentService: CommentService;

  public readonly ticketController: TicketController;

  constructor(db: Knex, rbacService: RBACService, lookupResolver: LookupResolver) {
    this.ticketsDAO = new TicketsDAO(db);
    this.ticketCommentsDAO = new TicketCommentsDAO(db);
    this.ticketAttachmentsDAO = new TicketAttachmentsDAO(db);
    this.usersDAO = new UsersDAO(db);

    this.ticketService = new TicketService(
      this.ticketsDAO,
      this.usersDAO,
      rbacService,
      lookupResolver
    );
    this.commentService = new CommentService(
      this.ticketCommentsDAO,
      this.ticketsDAO,
      rbacService,
      lookupResolver
    );

    this.ticketController = new TicketController(
      this.ticketService,
      this.commentService,
      lookupResolver
    );
  }
}
