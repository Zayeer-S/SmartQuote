/* eslint-disable @typescript-eslint/unbound-method */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { QuoteEngineService } from '../../../src/server/services/quote/quote.engine.service';
import { ForbiddenError } from '../../../src/server/services/ticket/ticket.errors';
import { QUOTE_ERROR_MSGS } from '../../../src/server/services/quote/quote.errors';
import { TICKET_ERROR_MSGS } from '../../../src/server/services/ticket/ticket.errors';
import type { QuotesDAO } from '../../../src/server/daos/children/quotes.dao';
import type { TicketsDAO } from '../../../src/server/daos/children/tickets.dao';
import type { QuoteCalculationRulesDAO } from '../../../src/server/daos/children/quote.calculation.rules.dao';
import type {
  RateProfile,
  Ticket,
  QuoteCalculationRule,
} from '../../../src/server/database/types/tables';
import type { TicketId, UserId } from '../../../src/server/database/types/ids';
import { makeMockRateProfilesDAO } from './utils/mock.daos';
import { makeMockRBACService } from './utils/mock.services';

function makeMockQuotesDAO(): QuotesDAO {
  return {
    create: vi.fn(),
    findLatestForTicket: vi.fn().mockResolvedValue(null),
  } as unknown as QuotesDAO;
}

function makeMockTicketsDAO(): TicketsDAO {
  return {
    getById: vi.fn(),
    update: vi.fn(),
  } as unknown as TicketsDAO;
}

function makeMockRulesDAO(): QuoteCalculationRulesDAO {
  return {
    getAll: vi.fn(),
  } as unknown as QuoteCalculationRulesDAO;
}

const ACTOR_ID = 'user-1' as unknown as UserId;
const TICKET_ID = 'ticket-1' as unknown as TicketId;
const ONE_YEAR = 365 * 24 * 60 * 60 * 1000;

function makeTicket(overrides: Partial<Ticket> = {}): Ticket {
  return {
    id: TICKET_ID,
    ticket_type_id: 1,
    ticket_severity_id: 2,
    business_impact_id: 2,
    users_impacted: 10,
    ticket_priority_id: 2,
    organization_id: 'org-1',
    ...overrides,
  } as unknown as Ticket;
}

function makeRule(overrides: Partial<QuoteCalculationRule> = {}): QuoteCalculationRule {
  return {
    id: 1,
    ticket_severity_id: 2,
    business_impact_id: 2,
    users_impacted_min: 1,
    users_impacted_max: 999,
    urgency_multiplier: 1.5,
    suggested_ticket_priority_id: 2,
    priority_order: 1,
    is_active: true,
    ...overrides,
  } as unknown as QuoteCalculationRule;
}

function makeProfile(overrides: Partial<RateProfile> = {}): RateProfile {
  const now = new Date();
  return {
    id: 1,
    ticket_type_id: 1,
    ticket_severity_id: 2,
    business_impact_id: 2,
    business_hours_rate: 100,
    after_hours_rate: 150,
    multiplier: 1.0,
    is_active: true,
    effective_from: new Date(now.getTime() - 1000),
    effective_to: new Date(now.getTime() + ONE_YEAR),
    ...overrides,
  } as unknown as RateProfile;
}

// Freeze clock at a specific hour for deterministic time-of-day tests
function clockAt(hour: number): () => Date {
  return () => {
    const d = new Date();
    d.setHours(hour, 0, 0, 0);
    return d;
  };
}

describe('QuoteEngineService.generateQuote', () => {
  let quotesDAO: QuotesDAO;
  let ticketsDAO: TicketsDAO;
  let rateProfilesDAO: ReturnType<typeof makeMockRateProfilesDAO>;
  let rulesDAO: QuoteCalculationRulesDAO;
  let rbac: ReturnType<typeof makeMockRBACService>;

  // No lookup needed -- LookupResolver is only used for quoteCreatorId which we stub via the DAO
  const stubLookup = {
    quoteCreatorId: vi.fn().mockReturnValue(2),
  };

  function makeService(clock?: () => Date): QuoteEngineService {
    return new QuoteEngineService(
      quotesDAO,
      ticketsDAO,
      rateProfilesDAO,
      rulesDAO,
      rbac,
      stubLookup as never,
      clock
    );
  }

  beforeEach(() => {
    quotesDAO = makeMockQuotesDAO();
    ticketsDAO = makeMockTicketsDAO();
    rateProfilesDAO = makeMockRateProfilesDAO();
    rulesDAO = makeMockRulesDAO();
    rbac = makeMockRBACService();
  });

  it('throws ForbiddenError when actor lacks QUOTES_CREATE', async () => {
    vi.mocked(rbac.hasPermission).mockResolvedValue(false);

    await expect(makeService().generateQuote(TICKET_ID, ACTOR_ID)).rejects.toThrow(ForbiddenError);
    expect(ticketsDAO.getById).not.toHaveBeenCalled();
  });

  it('throws TicketError when ticket is not found', async () => {
    vi.mocked(rbac.hasPermission).mockResolvedValue(true);
    vi.mocked(ticketsDAO.getById).mockResolvedValue(null);

    await expect(makeService().generateQuote(TICKET_ID, ACTOR_ID)).rejects.toThrow(
      TICKET_ERROR_MSGS.NOT_FOUND
    );
  });

  it('throws QuoteError when no calculation rule matches the ticket', async () => {
    vi.mocked(rbac.hasPermission).mockResolvedValue(true);
    vi.mocked(ticketsDAO.getById).mockResolvedValue(makeTicket());
    // Rule has different severity -- won't match
    vi.mocked(rulesDAO.getAll).mockResolvedValue([makeRule({ ticket_severity_id: 99 as never })]);

    await expect(makeService().generateQuote(TICKET_ID, ACTOR_ID)).rejects.toThrow(
      QUOTE_ERROR_MSGS.NO_MATCHING_RULE
    );
  });

  it('throws QuoteError when no active rate profile matches the ticket', async () => {
    vi.mocked(rbac.hasPermission).mockResolvedValue(true);
    vi.mocked(ticketsDAO.getById).mockResolvedValue(makeTicket());
    vi.mocked(rulesDAO.getAll).mockResolvedValue([makeRule()]);
    // Profile has different type_id -- won't match
    vi.mocked(rateProfilesDAO.findActive).mockResolvedValue([
      makeProfile({ ticket_type_id: 99 as never }),
    ]);

    await expect(makeService().generateQuote(TICKET_ID, ACTOR_ID)).rejects.toThrow(
      QUOTE_ERROR_MSGS.NO_ACTIVE_RATE_PROFILE
    );
  });

  it('uses business_hours_rate during business hours (10:00)', async () => {
    vi.mocked(rbac.hasPermission).mockResolvedValue(true);
    vi.mocked(ticketsDAO.getById).mockResolvedValue(makeTicket());
    vi.mocked(rulesDAO.getAll).mockResolvedValue([makeRule()]);
    vi.mocked(rateProfilesDAO.findActive).mockResolvedValue([makeProfile()]);
    vi.mocked(ticketsDAO.update).mockResolvedValue(true);

    const createdQuote = { id: 'q-1', hourly_rate: 100 };
    vi.mocked(quotesDAO.create).mockResolvedValue(createdQuote as never);

    await makeService(clockAt(10)).generateQuote(TICKET_ID, ACTOR_ID);

    const createCall = vi.mocked(quotesDAO.create).mock.calls[0][0];
    expect(createCall.hourly_rate).toBe(100); // business_hours_rate
  });

  it('uses after_hours_rate outside business hours (20:00)', async () => {
    vi.mocked(rbac.hasPermission).mockResolvedValue(true);
    vi.mocked(ticketsDAO.getById).mockResolvedValue(makeTicket());
    vi.mocked(rulesDAO.getAll).mockResolvedValue([makeRule()]);
    vi.mocked(rateProfilesDAO.findActive).mockResolvedValue([makeProfile()]);
    vi.mocked(ticketsDAO.update).mockResolvedValue(true);

    const createdQuote = { id: 'q-1', hourly_rate: 150 };
    vi.mocked(quotesDAO.create).mockResolvedValue(createdQuote as never);

    await makeService(clockAt(20)).generateQuote(TICKET_ID, ACTOR_ID);

    const createCall = vi.mocked(quotesDAO.create).mock.calls[0][0];
    expect(createCall.hourly_rate).toBe(150); // after_hours_rate
  });

  it('picks the first matching rule by priority_order when multiple rules match', async () => {
    vi.mocked(rbac.hasPermission).mockResolvedValue(true);
    vi.mocked(ticketsDAO.getById).mockResolvedValue(makeTicket());

    const highPriorityRule = makeRule({
      priority_order: 1,
      urgency_multiplier: 2.0,
      suggested_ticket_priority_id: 1 as never,
    });
    const lowPriorityRule = makeRule({
      priority_order: 2,
      urgency_multiplier: 1.0,
      suggested_ticket_priority_id: 3 as never,
    });
    // getAll returns already ordered by priority_order ASC
    vi.mocked(rulesDAO.getAll).mockResolvedValue([highPriorityRule, lowPriorityRule]);
    vi.mocked(rateProfilesDAO.findActive).mockResolvedValue([makeProfile()]);
    vi.mocked(ticketsDAO.update).mockResolvedValue(true);
    vi.mocked(quotesDAO.create).mockResolvedValue({ id: 'q-1' } as never);

    await makeService(clockAt(10)).generateQuote(TICKET_ID, ACTOR_ID);

    const createCall = vi.mocked(quotesDAO.create).mock.calls[0][0];
    // urgency_multiplier from first rule: 2.0 applied to effortHoursMin=1, max=8
    expect(createCall.estimated_hours_minimum).toBe(2); // 1 * 2.0
    expect(createCall.estimated_hours_maximum).toBe(16); // 8 * 2.0
  });

  it('persists the quote and updates the ticket priority', async () => {
    vi.mocked(rbac.hasPermission).mockResolvedValue(true);
    vi.mocked(ticketsDAO.getById).mockResolvedValue(makeTicket());
    vi.mocked(rulesDAO.getAll).mockResolvedValue([makeRule()]);
    vi.mocked(rateProfilesDAO.findActive).mockResolvedValue([makeProfile()]);
    vi.mocked(ticketsDAO.update).mockResolvedValue(true);
    vi.mocked(quotesDAO.create).mockResolvedValue({ id: 'q-1' } as never);

    await makeService(clockAt(10)).generateQuote(TICKET_ID, ACTOR_ID);

    expect(quotesDAO.create).toHaveBeenCalledOnce();
    expect(ticketsDAO.update).toHaveBeenCalledWith(
      { id: TICKET_ID },
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      expect.objectContaining({ ticket_priority_id: expect.anything() }),
      undefined
    );
  });

  it('sets version to 1 when no previous quotes exist', async () => {
    vi.mocked(rbac.hasPermission).mockResolvedValue(true);
    vi.mocked(ticketsDAO.getById).mockResolvedValue(makeTicket());
    vi.mocked(rulesDAO.getAll).mockResolvedValue([makeRule()]);
    vi.mocked(rateProfilesDAO.findActive).mockResolvedValue([makeProfile()]);
    vi.mocked(ticketsDAO.update).mockResolvedValue(true);
    vi.mocked(quotesDAO.findLatestForTicket).mockResolvedValue(null);
    vi.mocked(quotesDAO.create).mockResolvedValue({ id: 'q-1' } as never);

    await makeService(clockAt(10)).generateQuote(TICKET_ID, ACTOR_ID);

    const createCall = vi.mocked(quotesDAO.create).mock.calls[0][0];
    expect(createCall.version).toBe(1);
  });

  it('increments version when a previous quote exists', async () => {
    vi.mocked(rbac.hasPermission).mockResolvedValue(true);
    vi.mocked(ticketsDAO.getById).mockResolvedValue(makeTicket());
    vi.mocked(rulesDAO.getAll).mockResolvedValue([makeRule()]);
    vi.mocked(rateProfilesDAO.findActive).mockResolvedValue([makeProfile()]);
    vi.mocked(ticketsDAO.update).mockResolvedValue(true);
    vi.mocked(quotesDAO.findLatestForTicket).mockResolvedValue({ version: 3 } as never);
    vi.mocked(quotesDAO.create).mockResolvedValue({ id: 'q-1' } as never);

    await makeService(clockAt(10)).generateQuote(TICKET_ID, ACTOR_ID);

    const createCall = vi.mocked(quotesDAO.create).mock.calls[0][0];
    expect(createCall.version).toBe(4);
  });

  it('passes the correct asOf date to findActive', async () => {
    vi.mocked(rbac.hasPermission).mockResolvedValue(true);
    vi.mocked(ticketsDAO.getById).mockResolvedValue(makeTicket());
    vi.mocked(rulesDAO.getAll).mockResolvedValue([makeRule()]);
    vi.mocked(rateProfilesDAO.findActive).mockResolvedValue([makeProfile()]);
    vi.mocked(ticketsDAO.update).mockResolvedValue(true);
    vi.mocked(quotesDAO.create).mockResolvedValue({ id: 'q-1' } as never);

    const frozenDate = new Date('2025-06-15T10:00:00');
    const clock = () => frozenDate;

    await makeService(clock).generateQuote(TICKET_ID, ACTOR_ID);

    expect(rateProfilesDAO.findActive).toHaveBeenCalledWith(frozenDate, undefined);
  });
});
