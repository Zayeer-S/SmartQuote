import type { Knex } from 'knex';
import type { RBACService } from '../services/rbac/rbac.service.js';
import type { LookupResolver } from '../lib/lookup-resolver.js';

import { TicketsDAO } from '../daos/children/tickets-domain.dao.js';
import {
  QuoteApprovalsDAO,
  QuoteCalculationRulesDAO,
  QuoteDetailRevisionsDAO,
  QuotesDAO,
} from '../daos/children/quotes-domain.dao.js';
import { RateProfilesDAO } from '../daos/children/rate-profiles.dao.js';
import { UsersDAO } from '../daos/children/users-domain.dao.js';

import { QuoteService } from '../services/quote/quote.service.js';
import { QuoteEngineService } from '../services/quote/quote-engine.service.js';
import { QuoteApprovalService } from '../services/quote/quote-approval.service.js';
import { QuoteController } from '../controllers/quote.controller.js';
import { OrganizationMembersDAO } from '../daos/children/organizations-domain.dao.js';
import type { NotificationService } from '../services/notification/notification.service.js';
import { MLQuoteService } from '../services/quote/ml-quote.service.js';
import { TicketEmbeddingsDAO } from '../daos/children/ticket-nlp.dao.js';
import { backEnv } from '../config/env.backend.js';

export class QuoteContainer {
  public readonly ticketsDAO: TicketsDAO;
  public readonly quotesDAO: QuotesDAO;
  public readonly quoteApprovalsDAO: QuoteApprovalsDAO;
  public readonly quoteDetailRevisionsDAO: QuoteDetailRevisionsDAO;
  public readonly rateProfilesDAO: RateProfilesDAO;
  public readonly quoteCalculationRulesDAO: QuoteCalculationRulesDAO;
  public readonly usersDAO: UsersDAO;
  public readonly ticketEmbeddingsDAO: TicketEmbeddingsDAO;

  public readonly quoteService: QuoteService;
  public readonly quoteEngineService: QuoteEngineService;
  public readonly quoteApprovalService: QuoteApprovalService;
  public readonly mlQuoteService: MLQuoteService;

  public readonly quoteController: QuoteController;

  constructor(
    db: Knex,
    rbacService: RBACService,
    lookup: LookupResolver,
    orgMembersDAO: OrganizationMembersDAO,
    notificationService: NotificationService
  ) {
    this.ticketsDAO = new TicketsDAO(db);
    this.quotesDAO = new QuotesDAO(db);
    this.quoteApprovalsDAO = new QuoteApprovalsDAO(db);
    this.quoteDetailRevisionsDAO = new QuoteDetailRevisionsDAO(db);
    this.rateProfilesDAO = new RateProfilesDAO(db);
    this.quoteCalculationRulesDAO = new QuoteCalculationRulesDAO(db);
    this.usersDAO = new UsersDAO(db);
    this.ticketEmbeddingsDAO = new TicketEmbeddingsDAO(db);

    this.quoteService = new QuoteService(
      this.quotesDAO,
      this.quoteDetailRevisionsDAO,
      this.ticketsDAO,
      this.usersDAO,
      orgMembersDAO,
      rbacService,
      lookup
    );

    this.quoteEngineService = new QuoteEngineService(
      this.quotesDAO,
      this.ticketsDAO,
      this.usersDAO,
      this.rateProfilesDAO,
      this.quoteCalculationRulesDAO,
      rbacService,
      lookup,
      notificationService
    );

    this.mlQuoteService = new MLQuoteService(
      this.ticketEmbeddingsDAO,
      backEnv.ML_QUOTE_SERVICE_URL
    );

    this.quoteApprovalService = new QuoteApprovalService(
      this.quotesDAO,
      this.quoteApprovalsDAO,
      this.usersDAO,
      rbacService,
      lookup
    );

    this.quoteController = new QuoteController(
      this.quoteService,
      this.quoteEngineService,
      this.quoteApprovalService,
      this.mlQuoteService,
      lookup
    );
  }
}
