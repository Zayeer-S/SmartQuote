import { BUSINESS_HOURS, PERMISSIONS, QUOTE_CREATORS } from '../../../shared/constants/index.js';
import type { InsertData, TransactionContext } from '../../daos/base/types.js';
import type { QuoteCalculationRulesDAO, QuotesDAO } from '../../daos/children/quotes-domain.dao.js';
import type { RateProfilesDAO } from '../../daos/children/rate-profiles.dao.js';
import type { TicketsDAO } from '../../daos/children/tickets-domain.dao.js';
import type { UsersDAO } from '../../daos/children/users-domain.dao.js';
import type { TicketId, UserId } from '../../database/types/ids.js';
import type {
  Quote,
  QuoteCalculationRule,
  RateProfile,
  Ticket,
} from '../../database/types/tables.js';
import type { RBACService } from '../rbac/rbac.service.js';
import type { LookupResolver } from '../../lib/lookup-resolver.js';
import { ForbiddenError, TICKET_ERROR_MSGS, TicketError } from '../ticket/ticket.errors.js';
import { QUOTE_ERROR_MSGS, QuoteError } from './quote.errors.js';
import type { NotificationService } from '../notification/notification.service.js';

export interface ComputeQuoteInput {
  ticket: Ticket;
  rule: QuoteCalculationRule;
  hourlyRate: number;
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
 * Pure function: derives quote figures from a ticket, matched rule, and resolved hourly rate.
 * Contains no I/O and is fully unit-testable in isolation.
 *
 * The caller is responsible for resolving which rate to pass in (business_hours_rate vs
 * after_hours_rate) before calling this function -- computeQuote has no clock awareness.
 *
 * Calculation logic:
 *   adjusted_min   = effortHoursMin x urgency_multiplier
 *   adjusted_max   = effortHoursMax x urgency_multiplier
 *   mid_hours      = (adjusted_min + adjusted_max) / 2
 *   estimated_cost = mid_hours x hourlyRate
 */
export function computeQuote(input: ComputeQuoteInput): ComputeQuoteResult {
  const { rule, hourlyRate, effortHoursMin, effortHoursMax } = input;

  const adjustedMin = effortHoursMin * rule.urgency_multiplier;
  const adjustedMax = effortHoursMax * rule.urgency_multiplier;
  const midHours = (adjustedMin + adjustedMax) / 2;

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

/**
 * Returns true if the given date falls within business hours.
 * Business hours are defined by BUSINESS_HOURS.START_HOUR (inclusive)
 * and BUSINESS_HOURS.END_HOUR (exclusive), local server time.
 *
 * Exported for unit testing.
 */
export function isBusinessHours(date: Date): boolean {
  const hour = date.getHours();
  return hour >= BUSINESS_HOURS.START_HOUR && hour < BUSINESS_HOURS.END_HOUR;
}

export class QuoteEngineService {
  private quotesDAO: QuotesDAO;
  private ticketsDAO: TicketsDAO;
  private usersDAO: UsersDAO;
  private rateProfilesDAO: RateProfilesDAO;
  private quoteCalculationRulesDAO: QuoteCalculationRulesDAO;
  private rbacService: RBACService;
  private lookup: LookupResolver;
  private notificationService: NotificationService;
  private clock: () => Date;

  constructor(
    quotesDAO: QuotesDAO,
    ticketsDAO: TicketsDAO,
    usersDAO: UsersDAO,
    rateProfilesDAO: RateProfilesDAO,
    quoteCalculationRulesDAO: QuoteCalculationRulesDAO,
    rbacService: RBACService,
    lookup: LookupResolver,
    notificationService: NotificationService,
    clock: () => Date = () => new Date()
  ) {
    this.quotesDAO = quotesDAO;
    this.ticketsDAO = ticketsDAO;
    this.usersDAO = usersDAO;
    this.rateProfilesDAO = rateProfilesDAO;
    this.quoteCalculationRulesDAO = quoteCalculationRulesDAO;
    this.rbacService = rbacService;
    this.lookup = lookup;
    this.notificationService = notificationService;
    this.clock = clock;
  }

  /**
   * Automatically generate a quote for a ticket using the rule engine.
   *
   * Steps:
   *  1. Resolve the best-matching QuoteCalculationRule (ordered by priority_order ASC,
   *     matching ticket_severity_id, business_impact_id, and users_impacted range).
   *  2. Resolve the active RateProfile matching ticket_type_id, ticket_severity_id,
   *     business_impact_id, and effective date range covering now.
   *  3. Select business_hours_rate or after_hours_rate based on current time.
   *  4. Resolve the effort hour range from the rule's suggested effort level.
   *  5. Delegate calculation to the pure `computeQuote` function.
   *  6. Persist as an AUTOMATED quote at version = latest + 1.
   *  7. Update the ticket's priority to the suggested priority from the rule.
   *  8. Notify the ticket creator that a quote is ready. Fire-and-forget.
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

    const now = this.clock();

    const rule = await this.resolveCalculationRule(ticket, options);
    const profile = await this.resolveRateProfile(ticket, now, options);
    const hourlyRate = isBusinessHours(now)
      ? (profile.business_hours_rate as unknown as number)
      : (profile.after_hours_rate as unknown as number);

    const { effortHoursMin, effortHoursMax } = await this.resolveEffortHours(rule, options);

    const computed = computeQuote({ ticket, rule, hourlyRate, effortHoursMin, effortHoursMax });

    const nextVersion = await this.resolveNextVersion(ticketId, options);

    // TODO: rule.quote_effort_level_id should be used here once QuoteCalculationRule
    // carries that field - currently the rule only has suggested_ticket_priority_id.
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
        quote_creator_id: this.lookup.quoteCreatorId(QUOTE_CREATORS.AUTOMATED),
        suggested_ticket_priority_id:
          computed.suggested_ticket_priority_id as unknown as Quote['suggested_ticket_priority_id'],
        quote_effort_level_id:
          rule.suggested_ticket_priority_id as unknown as Quote['quote_effort_level_id'],
        deleted_at: null,
      } satisfies InsertData<Quote>,
      options
    );

    await this.ticketsDAO.update(
      { id: ticketId },
      {
        ticket_priority_id:
          computed.suggested_ticket_priority_id as unknown as Ticket['ticket_priority_id'],
      },
      options
    );

    const creator = await this.usersDAO.getById(ticket.creator_user_id, options);
    if (creator) {
      void this.notificationService.notifyQuoteGenerated({
        quoteId: newQuote.id as string,
        ticketId: ticket.id as string,
        ticketTitle: ticket.title,
        // Do Number() due to pg
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-conversion
        estimatedHoursMin: Number(newQuote.estimated_hours_minimum),
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-conversion
        estimatedHoursMax: Number(newQuote.estimated_hours_maximum),
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-conversion
        estimatedCost: Number(newQuote.estimated_cost),
        suggestedPriority: this.lookup.ticketPriorityName(
          computed.suggested_ticket_priority_id as unknown as number
        ),
        effortLevel: this.lookup.quoteEffortLevelName(
          newQuote.quote_effort_level_id as unknown as number
        ),
        userId: creator.id as string,
        userEmail: creator.email,
        userFirstName: creator.first_name,
      });
    }

    return newQuote;
  }

  /**
   * Find the highest-priority active calculation rule that matches the ticket's
   * severity, business impact, and users_impacted range.
   * Rules are ordered by priority_order ASC -- lowest number wins.
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
   * Find the active rate profile matching the ticket's type, severity, and business
   * impact where the given date falls within the effective date range.
   */
  private async resolveRateProfile(
    ticket: Ticket,
    asOf: Date,
    options?: TransactionContext
  ): Promise<RateProfile> {
    const activeProfiles = await this.rateProfilesDAO.findActive(asOf, options);

    const matched = activeProfiles.find(
      (profile) =>
        (profile.ticket_type_id as unknown as number) ===
          (ticket.ticket_type_id as unknown as number) &&
        (profile.ticket_severity_id as unknown as number) ===
          (ticket.ticket_severity_id as unknown as number) &&
        (profile.business_impact_id as unknown as number) ===
          (ticket.business_impact_id as unknown as number)
    );

    if (!matched) throw new QuoteError(QUOTE_ERROR_MSGS.NO_ACTIVE_RATE_PROFILE, 422);
    return matched;
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  private async resolveEffortHours(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _rule: QuoteCalculationRule,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _options?: TransactionContext
  ): Promise<{ effortHoursMin: number; effortHoursMax: number }> {
    // TODO: inject QuoteEffortLevelRangesDAO and query properly when seed data is in place.
    return { effortHoursMin: 1, effortHoursMax: 8 };
  }

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
