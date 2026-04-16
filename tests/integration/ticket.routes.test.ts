/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { describe, it, expect, beforeAll } from 'vitest';
import path from 'path';
import request from 'supertest';
import type { Express } from 'express';
import { bootstrapApplication } from '../../src/server/bootstrap/app.bootstrap';
import { AUTH_ENDPOINTS, TICKET_ENDPOINTS } from '../../src/shared/constants/endpoints';
import { USERS } from '../constants/test.user.credentials';

const LOGIN = `/api${AUTH_ENDPOINTS.BASE}${AUTH_ENDPOINTS.LOGIN}`;
const BASE = `/api${TICKET_ENDPOINTS.BASE}`;

const FIXTURES = path.join(__dirname, '../fixtures');

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
  const bootstrap = await bootstrapApplication({ runBackgroundJobs: false });
  app = bootstrap.app;

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
    login(USERS.CUSTOMER1_DIFF_ORG.EMAIL, USERS.CUSTOMER1_DIFF_ORG.PASSWORD),
    login(USERS.CUSTOMER2_SAME_ORG.EMAIL, USERS.CUSTOMER2_SAME_ORG.PASSWORD),
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

    expect(res.status).toBe(201);
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

describe(`POST ${BASE}${TICKET_ENDPOINTS.UPLOAD_ATTACHMENT()}`, () => {
  // One ticket shared across all upload tests - upload count accumulates
  // deliberately so the MAX_COUNT test can rely on prior uploads.
  let ticketId: string;

  beforeAll(async () => {
    const res = await request(app)
      .post(`${BASE}${TICKET_ENDPOINTS.CREATE}`)
      .set('Authorization', `Bearer ${customer1Token}`)
      .send({
        title: 'Attachment upload test ticket',
        description: 'Created for attachment endpoint testing.',
        ticketType: 'Support',
        ticketSeverity: 'Low',
        businessImpact: 'Minor',
        deadline: new Date(Date.now() + 86400000 * 7).toISOString(),
        usersImpacted: 1,
      });

    ticketId = res.body.data.id as string;
  });

  it('returns 401 when unauthenticated', async () => {
    const res = await request(app)
      .post(`${BASE}${TICKET_ENDPOINTS.UPLOAD_ATTACHMENT(ticketId)}`)
      .send({});

    expect(res.status).toBe(401);
  });

  it('returns 400 when no file is provided', async () => {
    const res = await request(app)
      .post(`${BASE}${TICKET_ENDPOINTS.UPLOAD_ATTACHMENT(ticketId)}`)
      .set('Authorization', `Bearer ${customer1Token}`)
      .send({});

    expect(res.status).toBe(400);
  });

  it('returns 400 when a disallowed MIME type is uploaded', async () => {
    const res = await request(app)
      .post(`${BASE}${TICKET_ENDPOINTS.UPLOAD_ATTACHMENT(ticketId)}`)
      .set('Authorization', `Bearer ${customer1Token}`)
      .attach('file', path.join(FIXTURES, 'sample.txt'));

    expect(res.status).toBe(400);
  });

  it('returns 400 when a file exceeds 5MB', async () => {
    const oversizedBuffer = Buffer.alloc(5 * 1024 * 1024 + 1);

    const res = await request(app)
      .post(`${BASE}${TICKET_ENDPOINTS.UPLOAD_ATTACHMENT(ticketId)}`)
      .set('Authorization', `Bearer ${customer1Token}`)
      .attach('file', oversizedBuffer, { filename: 'big.pdf', contentType: 'application/pdf' });

    expect(res.status).toBe(400);
  });

  // Uploads 1-3: valid files that also accumulate toward the MAX_COUNT limit
  it('returns 201 and attachment metadata when a valid PDF is uploaded (1/5)', async () => {
    const res = await request(app)
      .post(`${BASE}${TICKET_ENDPOINTS.UPLOAD_ATTACHMENT(ticketId)}`)
      .set('Authorization', `Bearer ${customer1Token}`)
      .attach('file', path.join(FIXTURES, 'sample.pdf'));

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      ticketId,
      originalName: 'sample.pdf',
      mimeType: 'application/pdf',
      sizeBytes: expect.any(Number),
      storageKey: expect.any(String),
      uploadedByUserId: expect.any(String),
    });
  });

  it('returns 201 when a valid JPEG is uploaded (2/5)', async () => {
    const res = await request(app)
      .post(`${BASE}${TICKET_ENDPOINTS.UPLOAD_ATTACHMENT(ticketId)}`)
      .set('Authorization', `Bearer ${customer1Token}`)
      .attach('file', path.join(FIXTURES, 'sample.jpg'));

    expect(res.status).toBe(201);
    expect(res.body.data.mimeType).toBe('image/jpeg');
  });

  it('returns 201 when a valid PNG is uploaded (3/5)', async () => {
    const res = await request(app)
      .post(`${BASE}${TICKET_ENDPOINTS.UPLOAD_ATTACHMENT(ticketId)}`)
      .set('Authorization', `Bearer ${customer1Token}`)
      .attach('file', path.join(FIXTURES, 'sample.png'));

    expect(res.status).toBe(201);
    expect(res.body.data.mimeType).toBe('image/png');
  });

  it('returns 201 for 4th attachment', async () => {
    const res = await request(app)
      .post(`${BASE}${TICKET_ENDPOINTS.UPLOAD_ATTACHMENT(ticketId)}`)
      .set('Authorization', `Bearer ${customer1Token}`)
      .attach('file', path.join(FIXTURES, 'sample.pdf'));

    expect(res.status).toBe(201);
  });

  it('returns 201 for 5th attachment (cap)', async () => {
    const res = await request(app)
      .post(`${BASE}${TICKET_ENDPOINTS.UPLOAD_ATTACHMENT(ticketId)}`)
      .set('Authorization', `Bearer ${customer1Token}`)
      .attach('file', path.join(FIXTURES, 'sample.pdf'));

    expect(res.status).toBe(201);
  });

  it('returns 400 when a 6th attachment is uploaded (MAX_COUNT=5 exceeded)', async () => {
    const res = await request(app)
      .post(`${BASE}${TICKET_ENDPOINTS.UPLOAD_ATTACHMENT(ticketId)}`)
      .set('Authorization', `Bearer ${customer1Token}`)
      .attach('file', path.join(FIXTURES, 'sample.pdf'));

    expect(res.status).toBe(400);
  });
});

describe(`GET ${BASE}${TICKET_ENDPOINTS.GET()} - attachments`, () => {
  let createdTicketId: string;

  beforeAll(async () => {
    // Step 1: create ticket as JSON
    const createRes = await request(app)
      .post(`${BASE}${TICKET_ENDPOINTS.CREATE}`)
      .set('Authorization', `Bearer ${customer1Token}`)
      .send({
        title: 'Attachment detail test ticket',
        description: 'For attachment response shape testing',
        ticketType: 'Support',
        ticketSeverity: 'Low',
        businessImpact: 'Minor',
        deadline: new Date(Date.now() + 86400000 * 7).toISOString(),
        usersImpacted: 1,
      });

    createdTicketId = createRes.body.data.id as string;

    // Step 2: upload attachment separately
    await request(app)
      .post(`${BASE}${TICKET_ENDPOINTS.UPLOAD_ATTACHMENT(createdTicketId)}`)
      .set('Authorization', `Bearer ${customer1Token}`)
      .attach('file', path.join(FIXTURES, 'sample.pdf'));
  });

  it('includes an attachments array in the ticket detail response', async () => {
    const res = await request(app)
      .get(`${BASE}${TICKET_ENDPOINTS.GET(createdTicketId)}`)
      .set('Authorization', `Bearer ${customer1Token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.attachments)).toBe(true);
    expect(res.body.data.attachments).toHaveLength(1);
    expect(res.body.data.attachments[0]).toMatchObject({
      originalName: 'sample.pdf',
      mimeType: 'application/pdf',
      sizeBytes: expect.any(Number),
      storageKey: expect.any(String),
      uploadedByUserId: expect.any(String),
    });
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
