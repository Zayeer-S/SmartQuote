import { describe, it, expect } from 'vitest';
import {
  computeQuote,
  isBusinessHours,
} from '../../../src/server/services/quote/quote.engine.service';
import type { ComputeQuoteInput } from '../../../src/server/services/quote/quote.engine.service';
import type { QuoteCalculationRule, Ticket } from '../../../src/server/database/types/tables';

function makeRule(overrides: Partial<QuoteCalculationRule> = {}): QuoteCalculationRule {
  return {
    id: 1,
    urgency_multiplier: 1.0,
    suggested_ticket_priority_id: 2,
    ticket_severity_id: 1,
    business_impact_id: 1,
    users_impacted_min: 1,
    users_impacted_max: 999,
    priority_order: 1,
    is_active: true,
    name: 'stub',
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  } as unknown as QuoteCalculationRule;
}

function makeInput(overrides: Partial<ComputeQuoteInput> = {}): ComputeQuoteInput {
  return {
    ticket: {} as Ticket,
    rule: makeRule(),
    hourlyRate: 100,
    effortHoursMin: 2,
    effortHoursMax: 4,
    ...overrides,
  };
}

describe('computeQuote', () => {
  it('returns correct values with multiplier 1.0', () => {
    const result = computeQuote(
      makeInput({
        rule: makeRule({ urgency_multiplier: 1.0 }),
        hourlyRate: 100,
        effortHoursMin: 2,
        effortHoursMax: 4,
      })
    );

    expect(result.estimated_hours_minimum).toBe(2);
    expect(result.estimated_hours_maximum).toBe(4);
    expect(result.estimated_resolution_time).toBe(3); // (2+4)/2
    expect(result.hourly_rate).toBe(100);
    expect(result.estimated_cost).toBe(300); // 3 * 100
    expect(result.fixed_cost).toBe(0);
  });

  it('applies urgency_multiplier to hour estimates', () => {
    const result = computeQuote(
      makeInput({
        rule: makeRule({ urgency_multiplier: 2.0 }),
        hourlyRate: 100,
        effortHoursMin: 2,
        effortHoursMax: 4,
      })
    );

    expect(result.estimated_hours_minimum).toBe(4); // 2 * 2
    expect(result.estimated_hours_maximum).toBe(8); // 4 * 2
    expect(result.estimated_resolution_time).toBe(6); // (4+8)/2
    expect(result.estimated_cost).toBe(600); // 6 * 100
  });

  it('passes hourly_rate through unmodified', () => {
    const result = computeQuote(makeInput({ hourlyRate: 150 }));
    expect(result.hourly_rate).toBe(150);
  });

  it('carries suggested_ticket_priority_id from the rule', () => {
    const result = computeQuote(
      makeInput({
        rule: makeRule({
          suggested_ticket_priority_id:
            3 as unknown as QuoteCalculationRule['suggested_ticket_priority_id'],
        }),
      })
    );
    expect(result.suggested_ticket_priority_id).toBe(3);
  });

  it('always returns fixed_cost of 0', () => {
    const result = computeQuote(makeInput());
    expect(result.fixed_cost).toBe(0);
  });

  it('handles fractional multipliers correctly', () => {
    const result = computeQuote(
      makeInput({
        rule: makeRule({ urgency_multiplier: 1.5 }),
        hourlyRate: 80,
        effortHoursMin: 2,
        effortHoursMax: 6,
      })
    );

    // adjusted: 3, 9 -- mid: 6
    expect(result.estimated_hours_minimum).toBeCloseTo(3);
    expect(result.estimated_hours_maximum).toBeCloseTo(9);
    expect(result.estimated_resolution_time).toBeCloseTo(6);
    expect(result.estimated_cost).toBeCloseTo(480); // 6 * 80
  });
});

describe('isBusinessHours', () => {
  function makeDate(hour: number): Date {
    const d = new Date();
    d.setHours(hour, 0, 0, 0);
    return d;
  }

  it('returns true at 09:00 (boundary inclusive)', () => {
    expect(isBusinessHours(makeDate(9))).toBe(true);
  });

  it('returns true at 12:00', () => {
    expect(isBusinessHours(makeDate(12))).toBe(true);
  });

  it('returns true at 16:59', () => {
    const d = new Date();
    d.setHours(16, 59, 59, 999);
    expect(isBusinessHours(d)).toBe(true);
  });

  it('returns false at 17:00 (boundary exclusive)', () => {
    expect(isBusinessHours(makeDate(17))).toBe(false);
  });

  it('returns false at 08:59', () => {
    const d = new Date();
    d.setHours(8, 59, 59, 999);
    expect(isBusinessHours(d)).toBe(false);
  });

  it('returns false at midnight', () => {
    expect(isBusinessHours(makeDate(0))).toBe(false);
  });

  it('returns false at 23:00', () => {
    expect(isBusinessHours(makeDate(23))).toBe(false);
  });
});
