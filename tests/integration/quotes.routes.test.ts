/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { bootstrapApplication } from '../../src/server/bootstrap/app.bootstrap';
import {
  AUTH_ENDPOINTS,
  TICKET_ENDPOINTS,
  QUOTE_ENDPOINTS,
} from '../../src/shared/constants/endpoints';
import { USERS } from '../constants/test.user.credentials';

const LOGIN = `/api${AUTH_ENDPOINTS.BASE}${AUTH_ENDPOINTS.LOGIN}`;
const TICKETS_BASE = `/api${TICKET_ENDPOINTS.BASE}`;

function quotesBase(ticketId: string): string {
  return `${TICKETS_BASE}${QUOTE_ENDPOINTS.BASE(ticketId)}`;
}

let app: Express;
let customer1Token: string;
let customer2Token: string;
let agentToken: string;

let ticket1Id: string; // org1, INCIDENT, HIGH, MAJOR -- has seed rate profile
let ticket4Id: string; // org2, ENHANCEMENT, MEDIUM, MODERATE -- has seed rate profile

let ticket1QuoteId: string;
let ticket4QuoteId: string; // version 2 (latest, not soft-deleted)

beforeAll(async () => {
  app = await bootstrapApplication({ runBackgroundJobs: false });

  const login = async (email: string, password: string): Promise<string> => {
    const res = await request(app).post(LOGIN).send({ email, password });
    return res.body.data.token as string;
  };

  [customer1Token, customer2Token, agentToken] = await Promise.all([
    login(USERS.CUSTOMER1_DIFF_ORG.EMAIL, USERS.CUSTOMER1_DIFF_ORG.PASSWORD),
    login(USERS.CUSTOMER2_SAME_ORG.EMAIL, USERS.CUSTOMER2_SAME_ORG.PASSWORD),
    login(USERS.AGENT.EMAIL, USERS.AGENT.PASSWORD),
  ]);

  const listRes = await request(app)
    .get(`${TICKETS_BASE}${TICKET_ENDPOINTS.LIST}`)
    .set('Authorization', `Bearer ${agentToken}`);

  const tickets: { id: string; title: string }[] = listRes.body.data.tickets;
  ticket1Id = tickets.find((t) => t.title === 'Email notifications not working')!.id;
  ticket4Id = tickets.find((t) => t.title === 'Custom reporting dashboard integration')!.id;

  const q1Res = await request(app)
    .get(quotesBase(ticket1Id))
    .set('Authorization', `Bearer ${agentToken}`);
  ticket1QuoteId = q1Res.body.data.quotes[0].id as string;

  const q4Res = await request(app)
    .get(quotesBase(ticket4Id))
    .set('Authorization', `Bearer ${agentToken}`);
  const q4Quotes: { id: string; version: number }[] = q4Res.body.data.quotes;
  ticket4QuoteId = q4Quotes.find((q) => q.version === 2)!.id;
});

// ─── LIST ─────────────────────────────────────────────────────────────────────

describe(`GET ${TICKETS_BASE}${QUOTE_ENDPOINTS.LIST()}`, () => {
  it('returns 401 when unauthenticated', async () => {
    const res = await request(app).get(quotesBase(ticket1Id));
    expect(res.status).toBe(401);
  });

  it('returns quotes array for agent on any ticket', async () => {
    const res = await request(app)
      .get(quotesBase(ticket1Id))
      .set('Authorization', `Bearer ${agentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.quotes).toBeInstanceOf(Array);
    expect(res.body.data.quotes.length).toBeGreaterThan(0);
  });

  it('returns quotes for customer1 on their own org ticket', async () => {
    const res = await request(app)
      .get(quotesBase(ticket1Id))
      .set('Authorization', `Bearer ${customer1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.quotes).toBeInstanceOf(Array);
  });

  it('returns 403 when customer1 requests quotes for a ticket outside their org', async () => {
    const res = await request(app)
      .get(quotesBase(ticket4Id))
      .set('Authorization', `Bearer ${customer1Token}`);

    expect(res.status).toBe(403);
  });

  it('returns 404 when the ticket does not exist', async () => {
    const res = await request(app)
      .get(quotesBase('00000000-0000-0000-0000-000000000000'))
      .set('Authorization', `Bearer ${agentToken}`);

    expect(res.status).toBe(404);
  });
});

// ─── GET ──────────────────────────────────────────────────────────────────────

describe(`GET ${TICKETS_BASE}${QUOTE_ENDPOINTS.GET()}`, () => {
  it('returns 401 when unauthenticated', async () => {
    const res = await request(app).get(
      `${TICKETS_BASE}${QUOTE_ENDPOINTS.GET(ticket1Id, ticket1QuoteId)}`
    );
    expect(res.status).toBe(401);
  });

  it('returns 200 with quote data for agent', async () => {
    const res = await request(app)
      .get(`${TICKETS_BASE}${QUOTE_ENDPOINTS.GET(ticket1Id, ticket1QuoteId)}`)
      .set('Authorization', `Bearer ${agentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      id: ticket1QuoteId,
      ticketId: ticket1Id,
      version: expect.any(Number),
      estimatedCost: expect.any(Number),
    });
  });

  it('returns 200 for customer1 accessing a quote on their own org ticket', async () => {
    const res = await request(app)
      .get(`${TICKETS_BASE}${QUOTE_ENDPOINTS.GET(ticket1Id, ticket1QuoteId)}`)
      .set('Authorization', `Bearer ${customer1Token}`);

    expect(res.status).toBe(200);
  });

  it('returns 403 when customer1 accesses a quote on a different org ticket', async () => {
    const res = await request(app)
      .get(`${TICKETS_BASE}${QUOTE_ENDPOINTS.GET(ticket4Id, ticket4QuoteId)}`)
      .set('Authorization', `Bearer ${customer1Token}`);

    expect(res.status).toBe(403);
  });

  it('returns 404 for a nonexistent quote id', async () => {
    const res = await request(app)
      .get(
        `${TICKETS_BASE}${QUOTE_ENDPOINTS.GET(ticket1Id, '00000000-0000-0000-0000-000000000000')}`
      )
      .set('Authorization', `Bearer ${agentToken}`);

    expect(res.status).toBe(404);
  });
});

// ─── GENERATE ─────────────────────────────────────────────────────────────────

describe(`POST ${TICKETS_BASE}${QUOTE_ENDPOINTS.GENERATE()}`, () => {
  it('returns 401 when unauthenticated', async () => {
    const res = await request(app).post(`${TICKETS_BASE}${QUOTE_ENDPOINTS.GENERATE(ticket1Id)}`);
    expect(res.status).toBe(401);
  });

  it('returns 403 when customer tries to generate a quote', async () => {
    const res = await request(app)
      .post(`${TICKETS_BASE}${QUOTE_ENDPOINTS.GENERATE(ticket1Id)}`)
      .set('Authorization', `Bearer ${customer1Token}`);

    expect(res.status).toBe(403);
  });

  it('returns 201 with a generated quote for agent', async () => {
    const res = await request(app)
      .post(`${TICKETS_BASE}${QUOTE_ENDPOINTS.GENERATE(ticket1Id)}`)
      .set('Authorization', `Bearer ${agentToken}`);

    expect(res.status).toBe(201);
    expect(res.body.data.ruleBased).toMatchObject({
      ticketId: ticket1Id,
      version: expect.any(Number),
      hourlyRate: expect.any(Number),
      estimatedCost: expect.any(Number),
      quoteCreator: 'Automated',
    });
    expect(res.body.data).toHaveProperty('mlEstimate');
  });

  it('returns 404 when the ticket does not exist', async () => {
    const res = await request(app)
      .post(`${TICKETS_BASE}${QUOTE_ENDPOINTS.GENERATE('00000000-0000-0000-0000-000000000000')}`)
      .set('Authorization', `Bearer ${agentToken}`);

    expect(res.status).toBe(404);
  });
});

// ─── CREATE MANUAL ────────────────────────────────────────────────────────────

describe(`POST ${TICKETS_BASE}${QUOTE_ENDPOINTS.CREATE_MANUAL()}`, () => {
  const validManualQuote = {
    estimatedHoursMinimum: 4,
    estimatedHoursMaximum: 8,
    hourlyRate: 100,
    fixedCost: 0,
    quoteEffortLevel: 'Low',
    quoteConfidenceLevel: 'Medium',
  };

  it('returns 401 when unauthenticated', async () => {
    const res = await request(app)
      .post(`${TICKETS_BASE}${QUOTE_ENDPOINTS.CREATE_MANUAL(ticket1Id)}`)
      .send(validManualQuote);

    expect(res.status).toBe(401);
  });

  it('returns 403 when customer tries to create a manual quote', async () => {
    const res = await request(app)
      .post(`${TICKETS_BASE}${QUOTE_ENDPOINTS.CREATE_MANUAL(ticket1Id)}`)
      .set('Authorization', `Bearer ${customer1Token}`)
      .send(validManualQuote);

    expect(res.status).toBe(403);
  });

  it('returns 201 with the created quote for agent', async () => {
    const res = await request(app)
      .post(`${TICKETS_BASE}${QUOTE_ENDPOINTS.CREATE_MANUAL(ticket1Id)}`)
      .set('Authorization', `Bearer ${agentToken}`)
      .send(validManualQuote);

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      ticketId: ticket1Id,
      estimatedHoursMinimum: 4,
      estimatedHoursMaximum: 8,
      hourlyRate: 100,
      quoteCreator: 'Manual',
    });
  });

  it('returns 400 when estimatedHoursMaximum < estimatedHoursMinimum', async () => {
    const res = await request(app)
      .post(`${TICKETS_BASE}${QUOTE_ENDPOINTS.CREATE_MANUAL(ticket1Id)}`)
      .set('Authorization', `Bearer ${agentToken}`)
      .send({ ...validManualQuote, estimatedHoursMinimum: 10, estimatedHoursMaximum: 2 });

    expect(res.status).toBe(400);
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await request(app)
      .post(`${TICKETS_BASE}${QUOTE_ENDPOINTS.CREATE_MANUAL(ticket1Id)}`)
      .set('Authorization', `Bearer ${agentToken}`)
      .send({ estimatedHoursMinimum: 4 });

    expect(res.status).toBe(400);
  });

  it('returns 404 when the ticket does not exist', async () => {
    const res = await request(app)
      .post(
        `${TICKETS_BASE}${QUOTE_ENDPOINTS.CREATE_MANUAL('00000000-0000-0000-0000-000000000000')}`
      )
      .set('Authorization', `Bearer ${agentToken}`)
      .send(validManualQuote);

    expect(res.status).toBe(404);
  });
});

// ─── UPDATE ───────────────────────────────────────────────────────────────────

describe(`PATCH ${TICKETS_BASE}${QUOTE_ENDPOINTS.UPDATE()}`, () => {
  it('returns 401 when unauthenticated', async () => {
    const res = await request(app)
      .patch(`${TICKETS_BASE}${QUOTE_ENDPOINTS.UPDATE(ticket4Id, ticket4QuoteId)}`)
      .send({ hourlyRate: 120, reason: 'Rate adjustment' });

    expect(res.status).toBe(401);
  });

  it('returns 403 when customer tries to update a quote', async () => {
    const res = await request(app)
      .patch(`${TICKETS_BASE}${QUOTE_ENDPOINTS.UPDATE(ticket4Id, ticket4QuoteId)}`)
      .set('Authorization', `Bearer ${customer2Token}`)
      .send({ hourlyRate: 120, reason: 'Rate adjustment' });

    expect(res.status).toBe(403);
  });

  it('returns 200 with a new quote version for agent', async () => {
    const res = await request(app)
      .patch(`${TICKETS_BASE}${QUOTE_ENDPOINTS.UPDATE(ticket4Id, ticket4QuoteId)}`)
      .set('Authorization', `Bearer ${agentToken}`)
      .send({ hourlyRate: 120, reason: 'Adjusted after review' });

    expect(res.status).toBe(200);
    expect(res.body.data.hourlyRate).toBe(120);
    expect(res.body.data.version).toBeGreaterThan(2);
  });

  it('returns 400 when reason is missing', async () => {
    const res = await request(app)
      .patch(`${TICKETS_BASE}${QUOTE_ENDPOINTS.UPDATE(ticket4Id, ticket4QuoteId)}`)
      .set('Authorization', `Bearer ${agentToken}`)
      .send({ hourlyRate: 120 });

    expect(res.status).toBe(400);
  });

  it('returns 404 for a nonexistent quote id', async () => {
    const res = await request(app)
      .patch(
        `${TICKETS_BASE}${QUOTE_ENDPOINTS.UPDATE(ticket4Id, '00000000-0000-0000-0000-000000000000')}`
      )
      .set('Authorization', `Bearer ${agentToken}`)
      .send({ hourlyRate: 120, reason: 'Test' });

    expect(res.status).toBe(404);
  });
});
