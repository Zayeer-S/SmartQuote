import type { Knex } from 'knex';
import { TicketsDAO } from '../daos/children/tickets.dao';
import { TicketCommentsDAO } from '../daos/children/ticket.comments.dao';
import { TicketAttachmentsDAO } from '../daos/children/ticket.attachments.dao';
import { UsersDAO } from '../daos/children/users.dao';
import { TicketService } from '../services/ticket/ticket.service';
import { CommentService } from '../services/ticket/comment.service';
import { TicketController } from '../controllers/ticket.controller';
import { RBACService } from '../services/rbac/rbac.service';

export class TicketContainer {
  public readonly ticketsDAO: TicketsDAO;
  public readonly ticketCommentsDAO: TicketCommentsDAO;
  public readonly ticketAttachmentsDAO: TicketAttachmentsDAO;
  public readonly usersDAO: UsersDAO;

  public readonly ticketService: TicketService;
  public readonly commentService: CommentService;

  public readonly ticketController: TicketController;

  constructor(db: Knex, rbacService: RBACService) {
    this.ticketsDAO = new TicketsDAO(db);
    this.ticketCommentsDAO = new TicketCommentsDAO(db);
    this.ticketAttachmentsDAO = new TicketAttachmentsDAO(db);
    this.usersDAO = new UsersDAO(db);

    this.ticketService = new TicketService(this.ticketsDAO, this.usersDAO, rbacService);
    this.commentService = new CommentService(this.ticketCommentsDAO, this.ticketsDAO, rbacService);

    this.ticketController = new TicketController(this.ticketService, this.commentService);
  }
}
