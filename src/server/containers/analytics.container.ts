import type { Knex } from 'knex';
import { TicketsDAO } from '../daos/children/tickets.dao.js';
import { QuotesDAO } from '../daos/children/quotes.dao.js';
import { RBACService } from '../services/rbac/rbac.service.js';
import { AnalyticsService } from '../services/analytics/analytics.service.js';
import { AnalyticsController } from '../controllers/analytics.controller.js';

export class AnalyticsContainer {
  public readonly ticketsDAO: TicketsDAO;
  public readonly quotesDAO: QuotesDAO;
  public readonly analyticsService: AnalyticsService;
  public readonly analyticsController: AnalyticsController;

  constructor(db: Knex, rbacService: RBACService) {
    this.ticketsDAO = new TicketsDAO(db);
    this.quotesDAO = new QuotesDAO(db);

    this.analyticsService = new AnalyticsService(this.ticketsDAO, this.quotesDAO, rbacService);

    this.analyticsController = new AnalyticsController(this.analyticsService);
  }
}
