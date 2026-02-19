import type { Knex } from 'knex';
import type { RBACService } from '../services/rbac/rbac.service';

import { TicketsDAO } from '../daos/children/tickets.dao';
import { QuotesDAO } from '../daos/children/quotes.dao';
import { QuoteApprovalsDAO } from '../daos/children/quote.approvals.dao';
import { QuoteDetailRevisionsDAO } from '../daos/children/quote.detail.revisions.dao';
import { RateProfilesDAO } from '../daos/children/rate.profiles.dao';
import { QuoteCalculationRulesDAO } from '../daos/children/quote.calculation.rules.dao';
import { UsersDAO } from '../daos/children/users.dao';

import { QuoteService } from '../services/quote/quote.service';
import { QuoteEngineService } from '../services/quote/quote.engine.service';

import { QuoteController } from '../controllers/quote.controller';

export class QuoteContainer {
  public readonly ticketsDAO: TicketsDAO;
  public readonly quotesDAO: QuotesDAO;
  public readonly quoteApprovalsDAO: QuoteApprovalsDAO;
  public readonly quoteDetailRevisionsDAO: QuoteDetailRevisionsDAO;
  public readonly rateProfilesDAO: RateProfilesDAO;
  public readonly quoteCalculationRulesDAO: QuoteCalculationRulesDAO;
  public readonly usersDAO: UsersDAO;

  public readonly quoteService: QuoteService;
  public readonly quoteEngineService: QuoteEngineService;

  public readonly quoteController: QuoteController;

  constructor(db: Knex, rbacService: RBACService) {
    this.ticketsDAO = new TicketsDAO(db);
    this.quotesDAO = new QuotesDAO(db);
    this.quoteApprovalsDAO = new QuoteApprovalsDAO(db);
    this.quoteDetailRevisionsDAO = new QuoteDetailRevisionsDAO(db);
    this.rateProfilesDAO = new RateProfilesDAO(db);
    this.quoteCalculationRulesDAO = new QuoteCalculationRulesDAO(db);
    this.usersDAO = new UsersDAO(db);

    this.quoteService = new QuoteService(
      this.quotesDAO,
      this.quoteApprovalsDAO,
      this.quoteDetailRevisionsDAO,
      this.ticketsDAO,
      this.usersDAO,
      rbacService
    );
    this.quoteEngineService = new QuoteEngineService(
      this.quotesDAO,
      this.ticketsDAO,
      this.rateProfilesDAO,
      this.quoteCalculationRulesDAO,
      rbacService
    );

    this.quoteController = new QuoteController(this.quoteService, this.quoteEngineService);
  }
}
