/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { bootstrapApplication } from '../../src/server/bootstrap/app.bootstrap';
import { AUTH_ENDPOINTS, TICKET_ENDPOINTS } from '../../src/shared/constants/endpoints';
import { USERS } from '../e2e/constants/test.user.credentials';

const LOGIN = `/api${AUTH_ENDPOINTS.BASE}${AUTH_ENDPOINTS.LOGIN}`;
const BASE = `/api${TICKET_ENDPOINTS.BASE}`;

let app: Express;
let customer1Token: string;
let customer2Token: string;
let agentToken: string;
let adminToken: string;

// Seeded ticket ids discovered at runtime via the agent list endpoint
let ticket1Id: string; // org1, IN_PROGRESS, assigned to agent
let ticket2Id: string; // org1, OPEN, unassigned
let ticket3Id: string; // org2, RESOLVED
let ticket4Id: string; // org2, OPEN, unassigned

// Seeded agent user id - needed for the assign test
let agentUserId: string;

beforeAll(async () => {
  app = await bootstrapApplication({ runBackgroundJobs: false });

  const login = async (
    email: string,
    password: string
  ): Promise<{ token: string; userId: string }> => {
    const res = await request(app).post(LOGIN).send({ email, password });
    return {
      token: res.body.data.token as string,
      userId: res.body.data.user.id as string,
    };
  };

  const [customer1, customer2, agent, admin] = await Promise.all([
    login(USERS.CUSTOMER1.EMAIL, USERS.CUSTOMER1.PASSWORD),
    login(USERS.CUSTOMER2.EMAIL, USERS.CUSTOMER2.PASSWORD),
    login(USERS.AGENT.EMAIL, USERS.AGENT.PASSWORD),
    login(USERS.ADMIN.EMAIL, USERS.ADMIN.PASSWORD),
  ]);

  customer1Token = customer1.token;
  customer2Token = customer2.token;
  agentToken = agent.token;
  adminToken = admin.token;
  agentUserId = agent.userId;

  // Discover seeded ticket ids via the agent (has TICKETS_READ_ALL)
  const listRes = await request(app)
    .get(`${BASE}${TICKET_ENDPOINTS.LIST}`)
    .set('Authorization', `Bearer ${agentToken}`);

  const tickets: { id: string; title: string }[] = listRes.body.data.tickets;

  ticket1Id = tickets.find((t) => t.title === 'Email notifications not working')!.id;
  ticket2Id = tickets.find((t) => t.title === 'Request for bulk export feature')!.id;
  ticket3Id = tickets.find((t) => t.title === 'Unable to login to dashboard')!.id;
  ticket4Id = tickets.find((t) => t.title === 'Custom reporting dashboard integration')!.id;
});

describe(`GET ${BASE}${TICKET_ENDPOINTS.LIST}`, () => {
  it('returns 401 when unauthenticated', async () => {
    const res = await request(app).get(`${BASE}${TICKET_ENDPOINTS.LIST}`);

    expect(res.status).toBe(401);
  });

  it('returns only org1 tickets for customer1', async () => {
    const res = await request(app)
      .get(`${BASE}${TICKET_ENDPOINTS.LIST}`)
      .set('Authorization', `Bearer ${customer1Token}`);

    expect(res.status).toBe(200);
    const ids: string[] = res.body.data.tickets.map((t: { id: string }) => t.id);
    expect(ids).toContain(ticket1Id);
    expect(ids).toContain(ticket2Id);
    expect(ids).not.toContain(ticket3Id);
    expect(ids).not.toContain(ticket4Id);
  });

  it('returns only org2 tickets for customer2', async () => {
    const res = await request(app)
      .get(`${BASE}${TICKET_ENDPOINTS.LIST}`)
      .set('Authorization', `Bearer ${customer2Token}`);

    expect(res.status).toBe(200);
    const ids: string[] = res.body.data.tickets.map((t: { id: string }) => t.id);
    expect(ids).toContain(ticket3Id);
    expect(ids).toContain(ticket4Id);
    expect(ids).not.toContain(ticket1Id);
    expect(ids).not.toContain(ticket2Id);
  });

  it('returns all tickets for the agent', async () => {
    const res = await request(app)
      .get(`${BASE}${TICKET_ENDPOINTS.LIST}`)
      .set('Authorization', `Bearer ${agentToken}`);

    expect(res.status).toBe(200);
    const ids: string[] = res.body.data.tickets.map((t: { id: string }) => t.id);
    expect(ids).toContain(ticket1Id);
    expect(ids).toContain(ticket2Id);
    expect(ids).toContain(ticket3Id);
    expect(ids).toContain(ticket4Id);
  });
});

describe(`GET ${BASE}${TICKET_ENDPOINTS.GET()}`, () => {
  it('returns 401 when unauthenticated', async () => {
    const res = await request(app).get(`${BASE}${TICKET_ENDPOINTS.GET(ticket1Id)}`);

    expect(res.status).toBe(401);
  });

  it('returns 200 with ticket data for customer1 accessing their own org ticket', async () => {
    const res = await request(app)
      .get(`${BASE}${TICKET_ENDPOINTS.GET(ticket1Id)}`)
      .set('Authorization', `Bearer ${customer1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      id: ticket1Id,
      title: 'Email notifications not working',
    });
  });

  it('returns 403 when customer1 accesses a ticket from a different org', async () => {
    const res = await request(app)
      .get(`${BASE}${TICKET_ENDPOINTS.GET(ticket3Id)}`)
      .set('Authorization', `Bearer ${customer1Token}`);

    expect(res.status).toBe(403);
  });

  it('returns 200 for agent accessing any ticket', async () => {
    const res = await request(app)
      .get(`${BASE}${TICKET_ENDPOINTS.GET(ticket3Id)}`)
      .set('Authorization', `Bearer ${agentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(ticket3Id);
  });

  it('returns 404 for a nonexistent ticket id', async () => {
    const res = await request(app)
      .get(`${BASE}${TICKET_ENDPOINTS.GET('00000000-0000-0000-0000-000000000000')}`)
      .set('Authorization', `Bearer ${agentToken}`);

    expect(res.status).toBe(404);
  });
});

describe(`POST ${BASE}${TICKET_ENDPOINTS.CREATE}`, () => {
  const validTicket = {
    title: 'Integration test ticket',
    description: 'Created during integration testing.',
    ticketType: 'Support',
    ticketSeverity: 'Low',
    businessImpact: 'Minor',
    deadline: new Date(Date.now() + 86400000 * 7).toISOString(),
    usersImpacted: 3,
  };

  it('returns 401 when unauthenticated', async () => {
    const res = await request(app).post(`${BASE}${TICKET_ENDPOINTS.CREATE}`).send(validTicket);

    expect(res.status).toBe(401);
  });

  it('returns 201 and the created ticket when customer1 submits a valid ticket', async () => {
    const res = await request(app)
      .post(`${BASE}${TICKET_ENDPOINTS.CREATE}`)
      .set('Authorization', `Bearer ${customer1Token}`)
      .send(validTicket);

    console.log('res.body:');
    console.log(res.body.error ?? JSON.stringify(res.body));
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      title: validTicket.title,
      creatorUserId: expect.any(String),
    });
  });

  it('allows admin (no org) to create a ticket with null organization_id', async () => {
    const res = await request(app)
      .post(`${BASE}${TICKET_ENDPOINTS.CREATE}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validTicket);

    expect(res.status).toBe(201); // or 200 depending on your controller
    expect(res.body.data.organizationId).toBeNull();
    expect(res.body.success).toBe(true);
  });

  it('returns 400 on a malformed request body', async () => {
    const res = await request(app)
      .post(`${BASE}${TICKET_ENDPOINTS.CREATE}`)
      .set('Authorization', `Bearer ${customer1Token}`)
      .send({ title: '' });

    expect(res.status).toBe(400);
  });
});

describe(`PATCH ${BASE}${TICKET_ENDPOINTS.UPDATE()}`, () => {
  it('returns 401 when unauthenticated', async () => {
    const res = await request(app)
      .patch(`${BASE}${TICKET_ENDPOINTS.UPDATE(ticket2Id)}`)
      .send({ title: 'Updated' });

    expect(res.status).toBe(401);
  });

  it('returns 200 when customer1 updates their own OPEN ticket', async () => {
    const res = await request(app)
      .patch(`${BASE}${TICKET_ENDPOINTS.UPDATE(ticket2Id)}`)
      .set('Authorization', `Bearer ${customer1Token}`)
      .send({ title: 'Updated export feature request' });

    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('Updated export feature request');
  });

  it('returns 422 when customer1 tries to update an IN_PROGRESS ticket', async () => {
    const res = await request(app)
      .patch(`${BASE}${TICKET_ENDPOINTS.UPDATE(ticket1Id)}`)
      .set('Authorization', `Bearer ${customer1Token}`)
      .send({ title: 'Sneaky update' });

    expect(res.status).toBe(422);
  });

  it('returns 403 when customer1 tries to update a ticket from a different org', async () => {
    const res = await request(app)
      .patch(`${BASE}${TICKET_ENDPOINTS.UPDATE(ticket4Id)}`)
      .set('Authorization', `Bearer ${customer1Token}`)
      .send({ title: 'Cross-org update attempt' });

    expect(res.status).toBe(403);
  });

  it('returns 200 when the agent updates any ticket regardless of status', async () => {
    const res = await request(app)
      .patch(`${BASE}${TICKET_ENDPOINTS.UPDATE(ticket1Id)}`)
      .set('Authorization', `Bearer ${agentToken}`)
      .send({ title: 'Agent updated title' });

    expect(res.status).toBe(200);
  });

  it('returns 404 for a nonexistent ticket id', async () => {
    const res = await request(app)
      .patch(`${BASE}${TICKET_ENDPOINTS.UPDATE('00000000-0000-0000-0000-000000000000')}`)
      .set('Authorization', `Bearer ${agentToken}`)
      .send({ title: 'Ghost update' });

    expect(res.status).toBe(404);
  });
});

describe(`POST ${BASE}${TICKET_ENDPOINTS.ASSIGN()}`, () => {
  it('returns 401 when unauthenticated', async () => {
    const res = await request(app)
      .post(`${BASE}${TICKET_ENDPOINTS.ASSIGN(ticket4Id)}`)
      .send({ assigneeId: agentUserId });

    expect(res.status).toBe(401);
  });

  it('returns 403 when customer tries to assign a ticket', async () => {
    const res = await request(app)
      .post(`${BASE}${TICKET_ENDPOINTS.ASSIGN(ticket4Id)}`)
      .set('Authorization', `Bearer ${customer1Token}`)
      .send({ assigneeId: agentUserId });

    expect(res.status).toBe(403);
  });

  it('returns 200 and sets the assignee when agent assigns a ticket', async () => {
    const res = await request(app)
      .post(`${BASE}${TICKET_ENDPOINTS.ASSIGN(ticket4Id)}`)
      .set('Authorization', `Bearer ${agentToken}`)
      .send({ assigneeId: agentUserId });

    expect(res.status).toBe(200);
    expect(res.body.data.assignedToUserId).toBe(agentUserId);
  });

  it('returns 404 when assigning to a nonexistent user', async () => {
    const res = await request(app)
      .post(`${BASE}${TICKET_ENDPOINTS.ASSIGN(ticket2Id)}`)
      .set('Authorization', `Bearer ${agentToken}`)
      .send({ assigneeId: '00000000-0000-0000-0000-000000000000' });

    expect(res.status).toBe(404);
  });
});

describe(`POST ${BASE}${TICKET_ENDPOINTS.RESOLVE()}`, () => {
  it('returns 401 when unauthenticated', async () => {
    const res = await request(app).post(`${BASE}${TICKET_ENDPOINTS.RESOLVE(ticket2Id)}`);

    expect(res.status).toBe(401);
  });

  it('returns 403 when customer tries to resolve a ticket', async () => {
    const res = await request(app)
      .post(`${BASE}${TICKET_ENDPOINTS.RESOLVE(ticket2Id)}`)
      .set('Authorization', `Bearer ${customer1Token}`);

    expect(res.status).toBe(403);
  });

  it('returns 200 when agent resolves a ticket', async () => {
    const res = await request(app)
      .post(`${BASE}${TICKET_ENDPOINTS.RESOLVE(ticket2Id)}`)
      .set('Authorization', `Bearer ${agentToken}`);

    expect(res.status).toBe(200);
  });

  it('returns 404 for a nonexistent ticket id', async () => {
    const res = await request(app)
      .post(`${BASE}${TICKET_ENDPOINTS.RESOLVE('00000000-0000-0000-0000-000000000000')}`)
      .set('Authorization', `Bearer ${agentToken}`);

    expect(res.status).toBe(404);
  });
});

describe(`DELETE ${BASE}${TICKET_ENDPOINTS.DELETE()}`, () => {
  it('returns 401 when unauthenticated', async () => {
    const res = await request(app).delete(`${BASE}${TICKET_ENDPOINTS.DELETE(ticket3Id)}`);

    expect(res.status).toBe(401);
  });

  it('returns 403 when customer tries to delete a ticket', async () => {
    const res = await request(app)
      .delete(`${BASE}${TICKET_ENDPOINTS.DELETE(ticket3Id)}`)
      .set('Authorization', `Bearer ${customer1Token}`);

    expect(res.status).toBe(403);
  });

  it('returns 403 when agent tries to delete a ticket', async () => {
    const res = await request(app)
      .delete(`${BASE}${TICKET_ENDPOINTS.DELETE(ticket3Id)}`)
      .set('Authorization', `Bearer ${agentToken}`);

    expect(res.status).toBe(403);
  });

  it('returns 200 when admin deletes a ticket', async () => {
    const res = await request(app)
      .delete(`${BASE}${TICKET_ENDPOINTS.DELETE(ticket3Id)}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
  });

  it('returns 404 for a nonexistent ticket id', async () => {
    const res = await request(app)
      .delete(`${BASE}${TICKET_ENDPOINTS.DELETE('00000000-0000-0000-0000-000000000000')}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
  });
});
