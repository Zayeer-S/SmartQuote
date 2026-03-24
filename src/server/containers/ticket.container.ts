import type { Knex } from 'knex';
import { TicketsDAO } from '../daos/children/tickets.dao.js';
import { TicketCommentsDAO } from '../daos/children/ticket.comments.dao.js';
import { TicketAttachmentsDAO } from '../daos/children/ticket.attachments.dao.js';
import { UsersDAO } from '../daos/children/users.dao.js';
import { TicketService } from '../services/ticket/ticket.service.js';
import { CommentService } from '../services/ticket/comment.service.js';
import { TicketPriorityEngine } from '../services/ticket/ticket.priority.engine.js';
import { TicketController } from '../controllers/ticket.controller.js';
import { RBACService } from '../services/rbac/rbac.service.js';
import { LookupResolver } from '../lib/lookup-resolver.js';
import type { BertEmbedder } from '../lib/nlp/bert-embedder.js';
import {
  TicketPriorityRulesDAO,
  TicketPriorityThresholdsDAO,
} from '../daos/children/ticket.priority.dao.js';
import { OrganizationMembersDAO } from '../daos/children/organizations.domain.dao.js';

export class TicketContainer {
  public readonly ticketsDAO: TicketsDAO;
  public readonly ticketCommentsDAO: TicketCommentsDAO;
  public readonly ticketAttachmentsDAO: TicketAttachmentsDAO;
  public readonly usersDAO: UsersDAO;
  public readonly priorityRulesDAO: TicketPriorityRulesDAO;
  public readonly priorityThresholdsDAO: TicketPriorityThresholdsDAO;

  public readonly priorityEngine: TicketPriorityEngine;
  public readonly ticketService: TicketService;
  public readonly commentService: CommentService;

  public readonly ticketController: TicketController;

  constructor(
    db: Knex,
    rbacService: RBACService,
    orgMembersDAO: OrganizationMembersDAO,
    lookupResolver: LookupResolver,
    embedder: BertEmbedder | null
  ) {
    this.ticketsDAO = new TicketsDAO(db);
    this.ticketCommentsDAO = new TicketCommentsDAO(db);
    this.ticketAttachmentsDAO = new TicketAttachmentsDAO(db);
    this.usersDAO = new UsersDAO(db);
    this.priorityRulesDAO = new TicketPriorityRulesDAO(db);
    this.priorityThresholdsDAO = new TicketPriorityThresholdsDAO(db);

    this.priorityEngine = new TicketPriorityEngine(
      this.priorityRulesDAO,
      this.priorityThresholdsDAO,
      embedder,
      db
    );

    this.ticketService = new TicketService(
      this.ticketsDAO,
      this.usersDAO,
      orgMembersDAO,
      rbacService,
      lookupResolver,
      this.priorityEngine
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
