// src/server/services/analytics/analytics.service.ts

import { PERMISSIONS } from '../../../shared/constants/index.js';
import type { TicketsDAO } from '../../daos/children/tickets.domain.dao.js';
import type { QuotesDAO } from '../../daos/children/quotes.dao.js';
import type { RBACService } from '../rbac/rbac.service.js';
import type { UserId } from '../../database/types/ids.js';
import type {
  QuoteAccuracyResponse,
  ResolutionTimeResponse,
  TicketVolumeResponse,
} from '../../../shared/contracts/analytics-contract.js';
import { AnalyticsForbiddenError, ANALYTICS_ERROR_MSGS } from './analytics.errors.js';

export class AnalyticsService {
  private ticketsDAO: TicketsDAO;
  private quotesDAO: QuotesDAO;
  private rbacService: RBACService;

  constructor(ticketsDAO: TicketsDAO, quotesDAO: QuotesDAO, rbacService: RBACService) {
    this.ticketsDAO = ticketsDAO;
    this.quotesDAO = quotesDAO;
    this.rbacService = rbacService;
  }

  /**
   * @param from Range start (inclusive)
   * @param to Range end (inclusive)
   * @param actorId Actor requesting the data
   * @returns Resolution time data points and average hours
   * @throws AnalyticsForbiddenError if actor lacks ANALYTICS_READ
   */
  async getResolutionTime(from: Date, to: Date, actorId: UserId): Promise<ResolutionTimeResponse> {
    await this.assertCanRead(actorId);

    const rows = await this.ticketsDAO.findAnalyticsResolutionTime(from, to);

    const averageHours =
      rows.length === 0 ? 0 : rows.reduce((sum, r) => sum + r.resolutionTimeHours, 0) / rows.length;

    return {
      data: rows.map((r) => ({
        ticketId: r.ticketId,
        createdAt: r.createdAt.toISOString(),
        resolvedAt: r.resolvedAt.toISOString(),
        resolutionTimeHours: r.resolutionTimeHours,
        ticketSeverity: r.ticketSeverity,
        businessImpact: r.businessImpact,
      })),
      averageHours: Math.round(averageHours * 100) / 100,
    };
  }

  /**
   * @param from Range start (inclusive)
   * @param to Range end (inclusive)
   * @param actorId Actor requesting the data
   * @returns Ticket volume grouped by day
   * @throws AnalyticsForbiddenError if actor lacks ANALYTICS_READ
   */
  async getTicketVolume(from: Date, to: Date, actorId: UserId): Promise<TicketVolumeResponse> {
    await this.assertCanRead(actorId);

    const rows = await this.ticketsDAO.findAnalyticsVolumeOverTime(from, to);

    return {
      data: rows.map((r) => ({
        day: r.day,
        count: r.count,
      })),
    };
  }

  /**
   * @param from Range start (inclusive)
   * @param to Range end (inclusive)
   * @param actorId Actor requesting the data
   * @returns Quote accuracy data points and average accuracy percentage
   * @throws AnalyticsForbiddenError if actor lacks ANALYTICS_READ
   */
  async getQuoteAccuracy(from: Date, to: Date, actorId: UserId): Promise<QuoteAccuracyResponse> {
    await this.assertCanRead(actorId);

    const rows = await this.quotesDAO.findAnalyticsQuoteAccuracy(from, to);

    const averageAccuracyPercentage =
      rows.length === 0 ? 0 : rows.reduce((sum, r) => sum + r.accuracyPercentage, 0) / rows.length;

    return {
      data: rows.map((r) => ({
        quoteId: r.quoteId,
        ticketId: r.ticketId,
        estimatedCost: r.estimatedCost,
        finalCost: r.finalCost,
        variance: r.variance,
        accuracyPercentage: r.accuracyPercentage,
        createdAt: r.createdAt.toISOString(),
      })),
      averageAccuracyPercentage: Math.round(averageAccuracyPercentage * 100) / 100,
    };
  }

  private async assertCanRead(actorId: UserId): Promise<void> {
    const can = await this.rbacService.hasPermission(actorId, PERMISSIONS.ANALYTICS_READ);
    if (!can) throw new AnalyticsForbiddenError(ANALYTICS_ERROR_MSGS.FORBIDDEN);
  }
}
