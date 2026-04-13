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

let app: Express;
let customer1Token: string;
let customer2Token: string;
let agentToken: string;
let managerToken: string;
let adminToken: string;

// All approval tests run against ticket1 (org1) so customer1 has visibility
let ticket1Id: string;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Create a fresh unsubmitted quote and return its id */
async function createQuote(fields: {
  estimatedHoursMinimum: number;
  estimatedHoursMaximum: number;
  hourlyRate: number;
  quoteEffortLevel: string;
}): Promise<string> {
  const res = await request(app)
    .post(`${TICKETS_BASE}${QUOTE_ENDPOINTS.CREATE_MANUAL(ticket1Id)}`)
    .set('Authorization', `Bearer ${agentToken}`)
    .send({ fixedCost: 0, quoteConfidenceLevel: null, ...fields });
  return res.body.data.id as string;
}

/** Submit a quote (APPROVED_BY_AGENT) and return the quote id */
async function submitQuote(quoteId: string): Promise<string> {
  await request(app)
    .post(`${TICKETS_BASE}${QUOTE_ENDPOINTS.SUBMIT(ticket1Id, quoteId)}`)
    .set('Authorization', `Bearer ${agentToken}`);
  return quoteId;
}

/** Create, submit, then manager-approve a quote. Returns the quote id. */
async function createAndManagerApprove(fields: Parameters<typeof createQuote>[0]): Promise<string> {
  const quoteId = await submitQuote(await createQuote(fields));
  await request(app)
    .post(`${TICKETS_BASE}${QUOTE_ENDPOINTS.MANAGER_APPROVE(ticket1Id, quoteId)}`)
    .set('Authorization', `Bearer ${managerToken}`)
    .send({ comment: null });
  return quoteId;
}

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeAll(async () => {
  app = await bootstrapApplication({ runBackgroundJobs: false });

  const login = async (email: string, password: string): Promise<string> => {
    const res = await request(app).post(LOGIN).send({ email, password });
    return res.body.data.token as string;
  };

  [customer1Token, customer2Token, agentToken, managerToken, adminToken] = await Promise.all([
    login(USERS.CUSTOMER1_DIFF_ORG.EMAIL, USERS.CUSTOMER1_DIFF_ORG.PASSWORD),
    login(USERS.CUSTOMER2_SAME_ORG.EMAIL, USERS.CUSTOMER2_SAME_ORG.PASSWORD),
    login(USERS.AGENT.EMAIL, USERS.AGENT.PASSWORD),
    login(USERS.MANAGER.EMAIL, USERS.MANAGER.PASSWORD),
    login(USERS.ADMIN.EMAIL, USERS.ADMIN.PASSWORD),
  ]);

  const listRes = await request(app)
    .get(`${TICKETS_BASE}${TICKET_ENDPOINTS.LIST}`)
    .set('Authorization', `Bearer ${agentToken}`);

  const tickets: { id: string; title: string }[] = listRes.body.data.tickets;
  ticket1Id = tickets.find((t) => t.title === 'Email notifications not working')!.id;
});

// ─── SUBMIT ───────────────────────────────────────────────────────────────────

describe(`POST ${TICKETS_BASE}${QUOTE_ENDPOINTS.SUBMIT()}`, () => {
  let freshQuoteId: string;

  beforeAll(async () => {
    freshQuoteId = await createQuote({
      estimatedHoursMinimum: 2,
      estimatedHoursMaximum: 6,
      hourlyRate: 90,
      quoteEffortLevel: 'Low',
    });
  });

  it('returns 401 when unauthenticated', async () => {
    const res = await request(app).post(
      `${TICKETS_BASE}${QUOTE_ENDPOINTS.SUBMIT(ticket1Id, freshQuoteId)}`
    );
    expect(res.status).toBe(401);
  });

  it('returns 403 when customer tries to submit', async () => {
    const res = await request(app)
      .post(`${TICKETS_BASE}${QUOTE_ENDPOINTS.SUBMIT(ticket1Id, freshQuoteId)}`)
      .set('Authorization', `Bearer ${customer1Token}`);

    expect(res.status).toBe(403);
  });

  it('returns 201 with APPROVED_BY_AGENT status for agent', async () => {
    const res = await request(app)
      .post(`${TICKETS_BASE}${QUOTE_ENDPOINTS.SUBMIT(ticket1Id, freshQuoteId)}`)
      .set('Authorization', `Bearer ${agentToken}`);

    expect(res.status).toBe(201);
    expect(res.body.data.approvalStatus).toBe('Approved By Agent');
  });

  it('returns 422 when submitting an already-submitted quote', async () => {
    const res = await request(app)
      .post(`${TICKETS_BASE}${QUOTE_ENDPOINTS.SUBMIT(ticket1Id, freshQuoteId)}`)
      .set('Authorization', `Bearer ${agentToken}`);

    expect(res.status).toBe(422);
  });
});

// ─── MANAGER APPROVE ─────────────────────────────────────────────────────────

describe(`POST ${TICKETS_BASE}${QUOTE_ENDPOINTS.MANAGER_APPROVE()}`, () => {
  let submittedQuoteId: string;

  beforeAll(async () => {
    submittedQuoteId = await submitQuote(
      await createQuote({
        estimatedHoursMinimum: 3,
        estimatedHoursMaximum: 7,
        hourlyRate: 95,
        quoteEffortLevel: 'Low',
      })
    );
  });

  it('returns 401 when unauthenticated', async () => {
    const res = await request(app).post(
      `${TICKETS_BASE}${QUOTE_ENDPOINTS.MANAGER_APPROVE(ticket1Id, submittedQuoteId)}`
    );
    expect(res.status).toBe(401);
  });

  it('returns 403 when agent tries to manager-approve', async () => {
    const res = await request(app)
      .post(`${TICKETS_BASE}${QUOTE_ENDPOINTS.MANAGER_APPROVE(ticket1Id, submittedQuoteId)}`)
      .set('Authorization', `Bearer ${agentToken}`);

    expect(res.status).toBe(403);
  });

  it('returns 403 when customer tries to manager-approve', async () => {
    const res = await request(app)
      .post(`${TICKETS_BASE}${QUOTE_ENDPOINTS.MANAGER_APPROVE(ticket1Id, submittedQuoteId)}`)
      .set('Authorization', `Bearer ${customer1Token}`);

    expect(res.status).toBe(403);
  });

  it('returns 200 with APPROVED_BY_MANAGER status for manager', async () => {
    const res = await request(app)
      .post(`${TICKETS_BASE}${QUOTE_ENDPOINTS.MANAGER_APPROVE(ticket1Id, submittedQuoteId)}`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ comment: 'Looks good' });

    expect(res.status).toBe(200);
    expect(res.body.data.approvalStatus).toBe('Approved By Manager');
    expect(res.body.data.comment).toBe('Looks good');
  });

  it('returns 422 when trying to manager-approve at wrong stage', async () => {
    // Already APPROVED_BY_MANAGER
    const res = await request(app)
      .post(`${TICKETS_BASE}${QUOTE_ENDPOINTS.MANAGER_APPROVE(ticket1Id, submittedQuoteId)}`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ comment: 'Double approve' });

    expect(res.status).toBe(422);
  });
});

// ─── MANAGER REJECT ───────────────────────────────────────────────────────────

describe(`POST ${TICKETS_BASE}${QUOTE_ENDPOINTS.MANAGER_REJECT()}`, () => {
  let submittedQuoteId: string;

  beforeAll(async () => {
    submittedQuoteId = await submitQuote(
      await createQuote({
        estimatedHoursMinimum: 5,
        estimatedHoursMaximum: 10,
        hourlyRate: 110,
        quoteEffortLevel: 'Medium',
      })
    );
  });

  it('returns 401 when unauthenticated', async () => {
    const res = await request(app).post(
      `${TICKETS_BASE}${QUOTE_ENDPOINTS.MANAGER_REJECT(ticket1Id, submittedQuoteId)}`
    );
    expect(res.status).toBe(401);
  });

  it('returns 403 when agent tries to manager-reject', async () => {
    const res = await request(app)
      .post(`${TICKETS_BASE}${QUOTE_ENDPOINTS.MANAGER_REJECT(ticket1Id, submittedQuoteId)}`)
      .set('Authorization', `Bearer ${agentToken}`);

    expect(res.status).toBe(403);
  });

  it('returns 400 when comment is missing', async () => {
    const res = await request(app)
      .post(`${TICKETS_BASE}${QUOTE_ENDPOINTS.MANAGER_REJECT(ticket1Id, submittedQuoteId)}`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({});

    expect(res.status).toBe(400);
  });

  it('returns 200 with REJECTED_BY_MANAGER status for manager', async () => {
    const res = await request(app)
      .post(`${TICKETS_BASE}${QUOTE_ENDPOINTS.MANAGER_REJECT(ticket1Id, submittedQuoteId)}`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ comment: 'Needs more detail' });

    expect(res.status).toBe(200);
    expect(res.body.data.approvalStatus).toBe('Rejected By Manager');
    expect(res.body.data.comment).toBe('Needs more detail');
  });

  it('returns 422 when trying to manager-reject at wrong stage', async () => {
    // Already REJECTED_BY_MANAGER
    const res = await request(app)
      .post(`${TICKETS_BASE}${QUOTE_ENDPOINTS.MANAGER_REJECT(ticket1Id, submittedQuoteId)}`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ comment: 'Double reject' });

    expect(res.status).toBe(422);
  });
});

// ─── ADMIN APPROVE ────────────────────────────────────────────────────────────

describe(`POST ${TICKETS_BASE}${QUOTE_ENDPOINTS.ADMIN_APPROVE()}`, () => {
  let submittedQuoteId: string;

  beforeAll(async () => {
    submittedQuoteId = await submitQuote(
      await createQuote({
        estimatedHoursMinimum: 4,
        estimatedHoursMaximum: 8,
        hourlyRate: 100,
        quoteEffortLevel: 'Medium',
      })
    );
  });

  it('returns 401 when unauthenticated', async () => {
    const res = await request(app).post(
      `${TICKETS_BASE}${QUOTE_ENDPOINTS.ADMIN_APPROVE(ticket1Id, submittedQuoteId)}`
    );
    expect(res.status).toBe(401);
  });

  it('returns 403 when manager tries to admin-approve', async () => {
    const res = await request(app)
      .post(`${TICKETS_BASE}${QUOTE_ENDPOINTS.ADMIN_APPROVE(ticket1Id, submittedQuoteId)}`)
      .set('Authorization', `Bearer ${managerToken}`);

    expect(res.status).toBe(403);
  });

  it('returns 200 with APPROVED_BY_ADMIN status for admin', async () => {
    const res = await request(app)
      .post(`${TICKETS_BASE}${QUOTE_ENDPOINTS.ADMIN_APPROVE(ticket1Id, submittedQuoteId)}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ comment: 'Admin bypass' });

    expect(res.status).toBe(200);
    expect(res.body.data.approvalStatus).toBe('Approved By Admin');
  });

  it('returns 422 when trying to admin-approve at wrong stage', async () => {
    // Already APPROVED_BY_ADMIN
    const res = await request(app)
      .post(`${TICKETS_BASE}${QUOTE_ENDPOINTS.ADMIN_APPROVE(ticket1Id, submittedQuoteId)}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ comment: 'Double approve' });

    expect(res.status).toBe(422);
  });
});

// ─── CUSTOMER APPROVE ─────────────────────────────────────────────────────────

describe(`POST ${TICKETS_BASE}${QUOTE_ENDPOINTS.CUSTOMER_APPROVE()}`, () => {
  let managerApprovedQuoteId: string;

  beforeAll(async () => {
    managerApprovedQuoteId = await createAndManagerApprove({
      estimatedHoursMinimum: 2,
      estimatedHoursMaximum: 5,
      hourlyRate: 85,
      quoteEffortLevel: 'Low',
    });
  });

  it('returns 401 when unauthenticated', async () => {
    const res = await request(app).post(
      `${TICKETS_BASE}${QUOTE_ENDPOINTS.CUSTOMER_APPROVE(ticket1Id, managerApprovedQuoteId)}`
    );
    expect(res.status).toBe(401);
  });

  it('returns 403 when agent tries to customer-approve', async () => {
    const res = await request(app)
      .post(`${TICKETS_BASE}${QUOTE_ENDPOINTS.CUSTOMER_APPROVE(ticket1Id, managerApprovedQuoteId)}`)
      .set('Authorization', `Bearer ${agentToken}`);

    expect(res.status).toBe(403);
  });

  it('returns 403 when customer from wrong org tries to customer-approve', async () => {
    // customer2 is on org2, ticket1 is org1
    const res = await request(app)
      .post(`${TICKETS_BASE}${QUOTE_ENDPOINTS.CUSTOMER_APPROVE(ticket1Id, managerApprovedQuoteId)}`)
      .set('Authorization', `Bearer ${customer2Token}`)
      .send({});

    expect(res.status).toBe(403);
  });

  it('returns 200 with APPROVED_BY_CUSTOMER status for customer', async () => {
    const res = await request(app)
      .post(`${TICKETS_BASE}${QUOTE_ENDPOINTS.CUSTOMER_APPROVE(ticket1Id, managerApprovedQuoteId)}`)
      .set('Authorization', `Bearer ${customer1Token}`)
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.data.approvalStatus).toBe('Approved By Customer');
  });

  it('returns 422 when trying to customer-approve at wrong stage', async () => {
    // Already APPROVED_BY_CUSTOMER
    const res = await request(app)
      .post(`${TICKETS_BASE}${QUOTE_ENDPOINTS.CUSTOMER_APPROVE(ticket1Id, managerApprovedQuoteId)}`)
      .set('Authorization', `Bearer ${customer1Token}`)
      .send({});

    expect(res.status).toBe(422);
  });
});

// ─── CUSTOMER REJECT ──────────────────────────────────────────────────────────

describe(`POST ${TICKETS_BASE}${QUOTE_ENDPOINTS.CUSTOMER_REJECT()}`, () => {
  let managerApprovedQuoteId: string;

  beforeAll(async () => {
    managerApprovedQuoteId = await createAndManagerApprove({
      estimatedHoursMinimum: 6,
      estimatedHoursMaximum: 12,
      hourlyRate: 120,
      quoteEffortLevel: 'High',
    });
  });

  it('returns 401 when unauthenticated', async () => {
    const res = await request(app).post(
      `${TICKETS_BASE}${QUOTE_ENDPOINTS.CUSTOMER_REJECT(ticket1Id, managerApprovedQuoteId)}`
    );
    expect(res.status).toBe(401);
  });

  it('returns 403 when agent tries to customer-reject', async () => {
    const res = await request(app)
      .post(`${TICKETS_BASE}${QUOTE_ENDPOINTS.CUSTOMER_REJECT(ticket1Id, managerApprovedQuoteId)}`)
      .set('Authorization', `Bearer ${agentToken}`);

    expect(res.status).toBe(403);
  });

  it('returns 400 when comment is missing', async () => {
    const res = await request(app)
      .post(`${TICKETS_BASE}${QUOTE_ENDPOINTS.CUSTOMER_REJECT(ticket1Id, managerApprovedQuoteId)}`)
      .set('Authorization', `Bearer ${customer1Token}`)
      .send({});

    expect(res.status).toBe(400);
  });

  it('returns 200 with REJECTED_BY_CUSTOMER status for customer', async () => {
    const res = await request(app)
      .post(`${TICKETS_BASE}${QUOTE_ENDPOINTS.CUSTOMER_REJECT(ticket1Id, managerApprovedQuoteId)}`)
      .set('Authorization', `Bearer ${customer1Token}`)
      .send({ comment: 'Too expensive' });

    expect(res.status).toBe(200);
    expect(res.body.data.approvalStatus).toBe('Rejected By Customer');
    expect(res.body.data.comment).toBe('Too expensive');
  });

  it('returns 422 when trying to customer-reject at wrong stage', async () => {
    // Already REJECTED_BY_CUSTOMER
    const res = await request(app)
      .post(`${TICKETS_BASE}${QUOTE_ENDPOINTS.CUSTOMER_REJECT(ticket1Id, managerApprovedQuoteId)}`)
      .set('Authorization', `Bearer ${customer1Token}`)
      .send({ comment: 'Double reject' });

    expect(res.status).toBe(422);
  });
});
