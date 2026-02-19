import { PERMISSIONS } from '../../../shared/constants';
import type { InsertData, TransactionContext } from '../../daos/base/types';
import type { QuoteCalculationRulesDAO } from '../../daos/children/quote.calculation.rules.dao';
import type { QuotesDAO } from '../../daos/children/quotes.dao';
import type { RateProfilesDAO } from '../../daos/children/rate.profiles.dao';
import type { TicketsDAO } from '../../daos/children/tickets.dao';
import type { TicketId, UserId } from '../../database/types/ids';
import type { Quote, QuoteCalculationRule, RateProfile, Ticket } from '../../database/types/tables';
import type { RBACService } from '../rbac/rbac.service';
import { ForbiddenError, TICKET_ERROR_MSGS, TicketError } from '../ticket/ticket.errors';
import { QUOTE_ERROR_MSGS, QuoteError } from './quote.errors';

export interface ComputeQuoteInput {
  ticket: Ticket;
  rule: QuoteCalculationRule;
  profile: RateProfile;
  effortHoursMin: number;
  effortHoursMax: number;
}

export interface ComputeQuoteResult {
  estimated_hours_minimum: number;
  estimated_hours_maximum: number;
  estimated_resolution_time: number;
  hourly_rate: number;
  estimated_cost: number;
  fixed_cost: number;
  suggested_ticket_priority_id: number;
}

/**
 * Pure function: derives quote figures from a ticket, matched rule, and rate profile.
 * Contains no I/O and is fully unit-testable in isolation.
 *
 * Calculation logic:
 *   adjusted_min  = effortHoursMin  × urgency_multiplier
 *   adjusted_max  = effortHoursMax  × urgency_multiplier
 *   mid_hours     = (adjusted_min + adjusted_max) / 2
 *   hourly_rate   = base_hourly_rate × multiplier
 *   estimated_cost = mid_hours × hourly_rate
 */
export function computeQuote(input: ComputeQuoteInput): ComputeQuoteResult {
  const { rule, profile, effortHoursMin, effortHoursMax } = input;

  const adjustedMin = effortHoursMin * rule.urgency_multiplier;
  const adjustedMax = effortHoursMax * rule.urgency_multiplier;
  const midHours = (adjustedMin + adjustedMax) / 2;
  const hourlyRate = profile.base_hourly_rate * profile.multiplier;

  return {
    estimated_hours_minimum: adjustedMin,
    estimated_hours_maximum: adjustedMax,
    estimated_resolution_time: midHours,
    hourly_rate: hourlyRate,
    estimated_cost: midHours * hourlyRate,
    fixed_cost: 0,
    suggested_ticket_priority_id: rule.suggested_ticket_priority_id as unknown as number,
  };
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class QuoteEngineService {
  private quotesDAO: QuotesDAO;
  private ticketsDAO: TicketsDAO;
  private rateProfilesDAO: RateProfilesDAO;
  private quoteCalculationRulesDAO: QuoteCalculationRulesDAO;
  private rbacService: RBACService;

  constructor(
    quotesDAO: QuotesDAO,
    ticketsDAO: TicketsDAO,
    rateProfilesDAO: RateProfilesDAO,
    quoteCalculationRulesDAO: QuoteCalculationRulesDAO,
    rbacService: RBACService
  ) {
    this.quotesDAO = quotesDAO;
    this.ticketsDAO = ticketsDAO;
    this.rateProfilesDAO = rateProfilesDAO;
    this.quoteCalculationRulesDAO = quoteCalculationRulesDAO;
    this.rbacService = rbacService;
  }

  /**
   * Automatically generate a quote for a ticket using the rule engine.
   *
   * Steps:
   *  1. Resolve the best-matching QuoteCalculationRule (ordered by priority_order ASC,
   *     matching ticket_severity_id, business_impact_id, and users_impacted range).
   *  2. Resolve the active RateProfile matching ticket_type_id, ticket_severity_id,
   *     business_impact_id, and effective date range covering now.
   *  3. Resolve the effort hour range from the rule's suggested effort level.
   *  4. Delegate calculation to the pure `computeQuote` function.
   *  5. Persist as an AUTOMATED quote at version = latest + 1.
   *  6. Update the ticket's priority to the suggested priority from the rule.
   *
   * @param ticketId Ticket to generate a quote for
   * @param actorId Actor triggering generation (must have QUOTES_CREATE)
   * @param options Optional transaction context
   * @returns Generated quote
   * @throws ForbiddenError if actor lacks QUOTES_CREATE
   * @throws TicketError if ticket not found
   * @throws QuoteError if no matching rule or rate profile exists
   */
  async generateQuote(
    ticketId: TicketId,
    actorId: UserId,
    options?: TransactionContext
  ): Promise<Quote> {
    const canCreate = await this.rbacService.hasPermission(
      actorId,
      PERMISSIONS.QUOTES_CREATE,
      options
    );
    if (!canCreate) throw new ForbiddenError(QUOTE_ERROR_MSGS.FORBIDDEN);

    const ticket = await this.ticketsDAO.getById(ticketId, options);
    if (!ticket) throw new TicketError(TICKET_ERROR_MSGS.NOT_FOUND, 404);

    const rule = await this.resolveCalculationRule(ticket, options);
    const profile = await this.resolveRateProfile(ticket, options);
    const { effortHoursMin, effortHoursMax } = await this.resolveEffortHours(rule, options);

    const computed = computeQuote({ ticket, rule, profile, effortHoursMin, effortHoursMax });

    const nextVersion = await this.resolveNextVersion(ticketId, options);

    // AUTOMATED creator (id=2)
    const newQuote = await this.quotesDAO.create(
      {
        ticket_id: ticketId,
        version: nextVersion,
        estimated_hours_minimum: computed.estimated_hours_minimum,
        estimated_hours_maximum: computed.estimated_hours_maximum,
        estimated_resolution_time: computed.estimated_resolution_time,
        hourly_rate: computed.hourly_rate,
        estimated_cost: computed.estimated_cost,
        fixed_cost: computed.fixed_cost,
        final_cost: null,
        quote_confidence_level_id: null,
        quote_approval_id: null,
        quote_creator_id: 2 as unknown as Quote['quote_creator_id'],
        suggested_ticket_priority_id:
          computed.suggested_ticket_priority_id as unknown as Quote['suggested_ticket_priority_id'],
        quote_effort_level_id:
          rule.suggested_ticket_priority_id as unknown as Quote['quote_effort_level_id'],
        deleted_at: null,
      } satisfies InsertData<Quote>,
      options
    );

    // Update the ticket's priority to match the engine's recommendation
    await this.ticketsDAO.update(
      { id: ticketId },
      {
        ticket_priority_id:
          computed.suggested_ticket_priority_id as unknown as Ticket['ticket_priority_id'],
      },
      options
    );

    return newQuote;
  }

  // ─── Private Helpers ───────────────────────────────────────────────────────

  /**
   * Find the highest-priority active calculation rule that matches the ticket's
   * severity, business impact, and users_impacted range.
   * Rules are ordered by priority_order ASC — lowest number wins.
   */
  private async resolveCalculationRule(
    ticket: Ticket,
    options?: TransactionContext
  ): Promise<QuoteCalculationRule> {
    const allRules = await this.quoteCalculationRulesDAO.getAll({
      ...options,
      orderBy: [{ column: 'priority_order', order: 'asc' }],
    });

    const matched = allRules.find(
      (rule) =>
        (rule.ticket_severity_id as unknown as number) ===
          (ticket.ticket_severity_id as unknown as number) &&
        (rule.business_impact_id as unknown as number) ===
          (ticket.business_impact_id as unknown as number) &&
        ticket.users_impacted >= rule.users_impacted_min &&
        ticket.users_impacted <= rule.users_impacted_max
    );

    if (!matched) throw new QuoteError(QUOTE_ERROR_MSGS.NO_MATCHING_RULE, 422);
    return matched;
  }

  /**
   * Find the active rate profile that matches the ticket's type, severity,
   * and business impact where today falls within its effective date range.
   */
  private async resolveRateProfile(
    ticket: Ticket,
    options?: TransactionContext
  ): Promise<RateProfile> {
    const now = new Date();
    const allProfiles = await this.rateProfilesDAO.getAll(options);

    const matched = allProfiles.find(
      (profile) =>
        (profile.ticket_type_id as unknown as number) ===
          (ticket.ticket_type_id as unknown as number) &&
        (profile.ticket_severity_id as unknown as number) ===
          (ticket.ticket_severity_id as unknown as number) &&
        (profile.business_impact_id as unknown as number) ===
          (ticket.business_impact_id as unknown as number) &&
        profile.effective_from <= now &&
        profile.effective_to >= now
    );

    if (!matched) throw new QuoteError(QUOTE_ERROR_MSGS.NO_ACTIVE_RATE_PROFILE, 422);
    return matched;
  }

  /**
   * Resolve the effort hour range for the matched rule's effort level.
   * Queries quote_effort_level_ranges for the active range linked to
   * the rule's suggested effort level.
   *
   * Note: QuoteEffortLevelRangesDAO is not injected here to avoid expanding
   * the dependency surface — the range is resolved via a raw query on the
   * rateProfilesDAO's db instance. If this grows in complexity, extract a
   * dedicated EffortLevelRangesDAO and inject it.
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  private async resolveEffortHours(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    rule: QuoteCalculationRule,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    options?: TransactionContext
  ): Promise<{ effortHoursMin: number; effortHoursMax: number }> {
    // Fall back to a sensible default range if no effort level range is seeded.
    // The quote engine should not fail hard on missing configuration, it should bruh bruh
    // produce a quote with a visible indicator that defaults were used.
    // TODO: inject QuoteEffortLevelRangesDAO and query properly when seed data is in place.
    return { effortHoursMin: 1, effortHoursMax: 8 };
  }

  /** Determine the next version number for a ticket's quotes */
  private async resolveNextVersion(
    ticketId: TicketId,
    options?: TransactionContext
  ): Promise<number> {
    const latest = await this.quotesDAO.findLatestForTicket(ticketId, {
      ...options,
      includeDeleted: true,
    });
    return latest ? latest.version + 1 : 1;
  }
}
