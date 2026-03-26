import type { Knex } from 'knex';
import type { RBACService } from '../services/rbac/rbac.service.js';
import type { LookupResolver } from '../lib/lookup-resolver.js';

import { TicketsDAO } from '../daos/children/tickets.dao.js';
import { QuotesDAO } from '../daos/children/quotes.dao.js';
import { QuoteApprovalsDAO } from '../daos/children/quote.approvals.dao.js';
import { QuoteDetailRevisionsDAO } from '../daos/children/quote.detail.revisions.dao.js';
import { RateProfilesDAO } from '../daos/children/rate.profiles.dao.js';
import { QuoteCalculationRulesDAO } from '../daos/children/quote.calculation.rules.dao.js';
import { UsersDAO } from '../daos/children/users.dao.js';

import { QuoteService } from '../services/quote/quote.service.js';
import { QuoteEngineService } from '../services/quote/quote.engine.service.js';
import { QuoteController } from '../controllers/quote.controller.js';
import { OrganizationMembersDAO } from '../daos/children/organizations.domain.dao.js';

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

  constructor(
    db: Knex,
    rbacService: RBACService,
    lookup: LookupResolver,
    orgMembersDAO: OrganizationMembersDAO
  ) {
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
      orgMembersDAO,
      rbacService,
      lookup
    );
    this.quoteEngineService = new QuoteEngineService(
      this.quotesDAO,
      this.ticketsDAO,
      this.rateProfilesDAO,
      this.quoteCalculationRulesDAO,
      rbacService,
      lookup
    );

    this.quoteController = new QuoteController(this.quoteService, this.quoteEngineService, lookup);
  }
}
