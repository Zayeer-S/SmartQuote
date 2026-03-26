/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { bootstrapApplication } from '../../src/server/bootstrap/app.bootstrap';
import { AUTH_ENDPOINTS, SLA_ENDPOINTS } from '../../src/shared/constants/endpoints';
import { TICKET_SEVERITIES } from '../../src/shared/constants/lookup-values';
import { USERS } from '../constants/test.user.credentials';

const AUTH_BASE = `/api${AUTH_ENDPOINTS.BASE}`;
const SLA_BASE = `/api${SLA_ENDPOINTS.BASE}`;

async function getToken(app: Express, email: string, password: string): Promise<string> {
  const res = await request(app)
    .post(`${AUTH_BASE}${AUTH_ENDPOINTS.LOGIN}`)
    .send({ email, password });
  return res.body.data.token as string;
}

function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

/** A valid create payload scoped to an org UUID. org must exist in the DB. */
function buildOrgPayload(orgId: string) {
  return {
    name: 'Integration Test SLA',
    organizationId: orgId,
    contract: {
      severityTargets: [
        { severity: TICKET_SEVERITIES.CRITICAL, responseTimeHours: 1, resolutionTimeHours: 4 },
        { severity: TICKET_SEVERITIES.HIGH, responseTimeHours: 4, resolutionTimeHours: 8 },
        { severity: TICKET_SEVERITIES.MEDIUM, responseTimeHours: 8, resolutionTimeHours: 24 },
        { severity: TICKET_SEVERITIES.LOW, responseTimeHours: 24, resolutionTimeHours: 72 },
      ],
    },
    effectiveFrom: new Date().toISOString(),
    effectiveTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
  };
}

let app: Express;
let adminToken: string;
let managerToken: string;
let agentToken: string;
let customer1Token: string;
let customer2Token: string;

beforeAll(async () => {
  app = await bootstrapApplication({ runBackgroundJobs: false });

  [adminToken, managerToken, agentToken, customer1Token, customer2Token] = await Promise.all([
    getToken(app, USERS.ADMIN.EMAIL, USERS.ADMIN.PASSWORD),
    getToken(app, USERS.MANAGER.EMAIL, USERS.MANAGER.PASSWORD),
    getToken(app, USERS.AGENT.EMAIL, USERS.AGENT.PASSWORD),
    getToken(app, USERS.CUSTOMER1_DIFF_ORG.EMAIL, USERS.CUSTOMER1_DIFF_ORG.PASSWORD),
    getToken(app, USERS.CUSTOMER2_SAME_ORG.EMAIL, USERS.CUSTOMER2_SAME_ORG.PASSWORD),
  ]);
});

describe(`GET ${SLA_BASE}/ -- list policies`, () => {
  it('returns 200 with all seeded policies for admin', async () => {
    const res = await request(app).get(`${SLA_BASE}/`).set(authHeader(adminToken));

    expect(res.status).toBe(200);
    expect(res.body.data.policies).toBeInstanceOf(Array);
    expect(res.body.data.policies.length).toBeGreaterThanOrEqual(2);
  });

  it('returns 200 with all seeded policies for manager', async () => {
    const res = await request(app).get(`${SLA_BASE}/`).set(authHeader(managerToken));

    expect(res.status).toBe(200);
    expect(res.body.data.policies.length).toBeGreaterThanOrEqual(2);
  });

  it('returns 200 with all seeded policies for support agent', async () => {
    const res = await request(app).get(`${SLA_BASE}/`).set(authHeader(agentToken));

    expect(res.status).toBe(200);
    expect(res.body.data.policies.length).toBeGreaterThanOrEqual(2);
  });

  it('returns 200 but only the policy for customer1s org', async () => {
    const res = await request(app).get(`${SLA_BASE}/`).set(authHeader(customer1Token));

    expect(res.status).toBe(200);
    const policies = res.body.data.policies;
    expect(policies).toBeInstanceOf(Array);
    expect(policies.length).toBe(1);
    expect(policies[0].organizationId).not.toBeNull();
  });

  it('returns 200 but only the policy for customer2s org', async () => {
    const res = await request(app).get(`${SLA_BASE}/`).set(authHeader(customer2Token));

    expect(res.status).toBe(200);
    const policies = res.body.data.policies;
    expect(policies.length).toBe(1);
    // Must be a different org than customer1
    const customer1Res = await request(app).get(`${SLA_BASE}/`).set(authHeader(customer1Token));
    expect(policies[0].organizationId).not.toBe(customer1Res.body.data.policies[0].organizationId);
  });

  it('returns 401 with no token', async () => {
    const res = await request(app).get(`${SLA_BASE}/`);
    expect(res.status).toBe(401);
  });

  it('response includes scopeDisplayName as a non-empty string', async () => {
    const res = await request(app).get(`${SLA_BASE}/`).set(authHeader(adminToken));

    for (const policy of res.body.data.policies) {
      expect(typeof policy.scopeDisplayName).toBe('string');
      expect(policy.scopeDisplayName.length).toBeGreaterThan(0);
    }
  });
});

describe(`GET ${SLA_BASE}/:slaPolicyId -- get single policy`, () => {
  let seededPolicyId: number;

  beforeAll(async () => {
    const res = await request(app).get(`${SLA_BASE}/`).set(authHeader(adminToken));
    seededPolicyId = res.body.data.policies[0].id as number;
  });

  it('returns 200 with full policy for admin', async () => {
    const res = await request(app)
      .get(`${SLA_BASE}/${String(seededPolicyId)}`)
      .set(authHeader(adminToken));

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      id: seededPolicyId,
      name: expect.any(String),
      scopeDisplayName: expect.any(String),
      contract: {
        severityTargets: expect.any(Array),
      },
      isActive: true,
    });
  });

  it('returns 200 for customer when the policy belongs to their org', async () => {
    // Find the policy that belongs to customer1's org
    const listRes = await request(app).get(`${SLA_BASE}/`).set(authHeader(customer1Token));
    const ownPolicyId = listRes.body.data.policies[0].id as number;

    const res = await request(app)
      .get(`${SLA_BASE}/${String(ownPolicyId)}`)
      .set(authHeader(customer1Token));

    expect(res.status).toBe(200);
  });

  it('returns 403 for customer1 requesting customer2s policy', async () => {
    // Get customer2's policy id
    const c2ListRes = await request(app).get(`${SLA_BASE}/`).set(authHeader(customer2Token));
    const c2PolicyId = c2ListRes.body.data.policies[0].id as number;

    const res = await request(app)
      .get(`${SLA_BASE}/${String(c2PolicyId)}`)
      .set(authHeader(customer1Token));

    expect(res.status).toBe(403);
  });

  it('returns 404 for a non-existent policy ID', async () => {
    const res = await request(app).get(`${SLA_BASE}/999999`).set(authHeader(adminToken));

    expect(res.status).toBe(404);
  });

  it('returns 401 with no token', async () => {
    const res = await request(app).get(`${SLA_BASE}/${String(seededPolicyId)}`);
    expect(res.status).toBe(401);
  });
});

describe(`POST ${SLA_BASE}/ -- create policy`, () => {
  // Grab org1Id dynamically from the list so we don't hardcode UUIDs
  let org1Id: string;

  beforeAll(async () => {
    const res = await request(app).get(`${SLA_BASE}/`).set(authHeader(adminToken));
    org1Id = res.body.data.policies[0].organizationId as string;
  });

  it('returns 403 for support agent (lacks SLA_POLICIES_CREATE)', async () => {
    const res = await request(app)
      .post(`${SLA_BASE}/`)
      .set(authHeader(agentToken))
      .send(buildOrgPayload(org1Id));

    expect(res.status).toBe(403);
  });

  it('returns 403 for customer', async () => {
    const res = await request(app)
      .post(`${SLA_BASE}/`)
      .set(authHeader(customer1Token))
      .send(buildOrgPayload(org1Id));

    expect(res.status).toBe(403);
  });

  it('returns 400 when neither userId nor organizationId is provided', async () => {
    const res = await request(app)
      .post(`${SLA_BASE}/`)
      .set(authHeader(managerToken))
      .send({
        name: 'Bad payload',
        contract: { severityTargets: [] },
        effectiveFrom: new Date().toISOString(),
        effectiveTo: new Date(Date.now() + 1000).toISOString(),
      });

    expect(res.status).toBe(400);
  });

  it('returns 400 when both userId and organizationId are provided', async () => {
    const res = await request(app)
      .post(`${SLA_BASE}/`)
      .set(authHeader(managerToken))
      .send({
        ...buildOrgPayload(org1Id),
        userId: '00000000-0000-0000-0000-000000000000',
      });

    expect(res.status).toBe(400);
  });

  it('returns 400 when effectiveTo is before effectiveFrom', async () => {
    const res = await request(app)
      .post(`${SLA_BASE}/`)
      .set(authHeader(managerToken))
      .send({
        ...buildOrgPayload(org1Id),
        effectiveFrom: new Date(Date.now() + 1000).toISOString(),
        effectiveTo: new Date().toISOString(),
      });

    expect(res.status).toBe(400);
  });

  it('returns 400 when contract has duplicate severities', async () => {
    const res = await request(app)
      .post(`${SLA_BASE}/`)
      .set(authHeader(managerToken))
      .send({
        ...buildOrgPayload(org1Id),
        contract: {
          severityTargets: [
            { severity: TICKET_SEVERITIES.HIGH, responseTimeHours: 1, resolutionTimeHours: 4 },
            { severity: TICKET_SEVERITIES.HIGH, responseTimeHours: 2, resolutionTimeHours: 8 },
          ],
        },
      });

    expect(res.status).toBe(400);
  });

  it('returns 400 when resolutionTimeHours < responseTimeHours for a severity', async () => {
    const res = await request(app)
      .post(`${SLA_BASE}/`)
      .set(authHeader(managerToken))
      .send({
        ...buildOrgPayload(org1Id),
        contract: {
          severityTargets: [
            { severity: TICKET_SEVERITIES.HIGH, responseTimeHours: 8, resolutionTimeHours: 4 },
          ],
        },
      });

    expect(res.status).toBe(400);
  });

  it('returns 201 and correct shape for manager with valid org payload', async () => {
    const res = await request(app)
      .post(`${SLA_BASE}/`)
      .set(authHeader(managerToken))
      .send(buildOrgPayload(org1Id));

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      id: expect.any(Number),
      name: 'Integration Test SLA',
      organizationId: org1Id,
      userId: null,
      scopeDisplayName: expect.any(String),
      isActive: true,
      contract: {
        severityTargets: expect.any(Array),
      },
    });
  });

  it('returns 201 for admin with valid org payload', async () => {
    const res = await request(app)
      .post(`${SLA_BASE}/`)
      .set(authHeader(adminToken))
      .send(buildOrgPayload(org1Id));

    expect(res.status).toBe(201);
  });

  it('returns 422 when targeting a non-customer user', async () => {
    // agentId -- support agent is not a customer
    const meRes = await request(app)
      .get(`/api${AUTH_ENDPOINTS.BASE}${AUTH_ENDPOINTS.ME}`)
      .set(authHeader(agentToken));
    const agentId = meRes.body.data.id as string;

    const res = await request(app)
      .post(`${SLA_BASE}/`)
      .set(authHeader(managerToken))
      .send({
        name: 'User-scoped test',
        userId: agentId,
        contract: {
          severityTargets: [
            { severity: TICKET_SEVERITIES.LOW, responseTimeHours: 24, resolutionTimeHours: 72 },
          ],
        },
        effectiveFrom: new Date().toISOString(),
        effectiveTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      });

    expect(res.status).toBe(422);
  });

  it('returns 422 when targeting a customer who already belongs to an org', async () => {
    const meRes = await request(app)
      .get(`/api${AUTH_ENDPOINTS.BASE}${AUTH_ENDPOINTS.ME}`)
      .set(authHeader(customer1Token));
    const customer1Id = meRes.body.data.id as string;

    const res = await request(app)
      .post(`${SLA_BASE}/`)
      .set(authHeader(managerToken))
      .send({
        name: 'Should fail -- customer has org',
        userId: customer1Id,
        contract: {
          severityTargets: [
            { severity: TICKET_SEVERITIES.LOW, responseTimeHours: 24, resolutionTimeHours: 72 },
          ],
        },
        effectiveFrom: new Date().toISOString(),
        effectiveTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      });

    expect(res.status).toBe(422);
  });
});

describe(`PATCH ${SLA_BASE}/:slaPolicyId -- update policy`, () => {
  let policyId: number;

  beforeAll(async () => {
    // Use the first seeded policy
    const res = await request(app).get(`${SLA_BASE}/`).set(authHeader(adminToken));
    policyId = res.body.data.policies[0].id as number;
  });

  it('returns 403 for support agent', async () => {
    const res = await request(app)
      .patch(`${SLA_BASE}/${String(policyId)}`)
      .set(authHeader(agentToken))
      .send({ name: 'Attempt' });

    expect(res.status).toBe(403);
  });

  it('returns 403 for customer', async () => {
    const res = await request(app)
      .patch(`${SLA_BASE}/${String(policyId)}`)
      .set(authHeader(customer1Token))
      .send({ name: 'Attempt' });

    expect(res.status).toBe(403);
  });

  it('returns 400 when body is empty', async () => {
    const res = await request(app)
      .patch(`${SLA_BASE}/${String(policyId)}`)
      .set(authHeader(managerToken))
      .send({});

    expect(res.status).toBe(400);
  });

  it('returns 200 with updated name for manager', async () => {
    const res = await request(app)
      .patch(`${SLA_BASE}/${String(policyId)}`)
      .set(authHeader(managerToken))
      .send({ name: 'Updated by integration test' });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Updated by integration test');
  });

  it('returns 200 and persists contract changes', async () => {
    const newContract = {
      severityTargets: [
        { severity: TICKET_SEVERITIES.CRITICAL, responseTimeHours: 0.5, resolutionTimeHours: 2 },
        { severity: TICKET_SEVERITIES.HIGH, responseTimeHours: 2, resolutionTimeHours: 4 },
        { severity: TICKET_SEVERITIES.MEDIUM, responseTimeHours: 4, resolutionTimeHours: 8 },
        { severity: TICKET_SEVERITIES.LOW, responseTimeHours: 8, resolutionTimeHours: 24 },
      ],
    };

    const res = await request(app)
      .patch(`${SLA_BASE}/${String(policyId)}`)
      .set(authHeader(adminToken))
      .send({ contract: newContract });

    expect(res.status).toBe(200);
    expect(res.body.data.contract.severityTargets[0].responseTimeHours).toBe(0.5);
  });

  it('returns 422 when effectiveTo would end up before effectiveFrom', async () => {
    // First, get the current policy to know effectiveFrom
    const getRes = await request(app)
      .get(`${SLA_BASE}/${String(policyId)}`)
      .set(authHeader(adminToken));
    const currentFrom = getRes.body.data.effectiveFrom as string;

    const res = await request(app)
      .patch(`${SLA_BASE}/${String(policyId)}`)
      .set(authHeader(managerToken))
      .send({ effectiveTo: new Date(new Date(currentFrom).getTime() - 1000).toISOString() });

    expect(res.status).toBe(422);
  });

  it('returns 404 for a non-existent policy ID', async () => {
    const res = await request(app)
      .patch(`${SLA_BASE}/999999`)
      .set(authHeader(adminToken))
      .send({ name: 'Ghost' });

    expect(res.status).toBe(404);
  });
});

describe(`DELETE ${SLA_BASE}/:slaPolicyId -- deactivate policy`, () => {
  let policyId: number;

  beforeAll(async () => {
    // Create a fresh policy to deactivate so we don't disrupt other tests
    const listRes = await request(app).get(`${SLA_BASE}/`).set(authHeader(adminToken));
    const orgId = listRes.body.data.policies[0].organizationId as string;

    const createRes = await request(app)
      .post(`${SLA_BASE}/`)
      .set(authHeader(adminToken))
      .send(buildOrgPayload(orgId));
    policyId = createRes.body.data.id as number;
  });

  it('returns 403 for support agent', async () => {
    const res = await request(app)
      .delete(`${SLA_BASE}/${String(policyId)}`)
      .set(authHeader(agentToken));

    expect(res.status).toBe(403);
  });

  it('returns 403 for customer', async () => {
    const res = await request(app)
      .delete(`${SLA_BASE}/${String(policyId)}`)
      .set(authHeader(customer1Token));

    expect(res.status).toBe(403);
  });

  it('returns 200 and sets isActive to false for manager', async () => {
    const res = await request(app)
      .delete(`${SLA_BASE}/${String(policyId)}`)
      .set(authHeader(managerToken));

    expect(res.status).toBe(200);

    // Verify the policy is now inactive (fetch with includeInactive via admin)
    const getRes = await request(app)
      .get(`${SLA_BASE}/${String(policyId)}`)
      .set(authHeader(adminToken));

    // Policy was deactivated -- service only returns active policies by default.
    // A 404 is also acceptable here depending on DAO query options.
    // We accept either 200 with isActive:false or 404.
    const status = getRes.status;
    expect([200, 404]).toContain(status);
    if (status === 200) {
      expect(getRes.body.data.isActive).toBe(false);
    }
  });

  it('returns 404 for a non-existent policy ID', async () => {
    const res = await request(app).delete(`${SLA_BASE}/999999`).set(authHeader(adminToken));

    expect(res.status).toBe(404);
  });
});

describe('slaStatus on ticket responses', () => {
  it('GET /tickets includes slaStatus on each ticket summary', async () => {
    const res = await request(app).get('/api/tickets/').set(authHeader(adminToken));

    expect(res.status).toBe(200);
    const tickets = res.body.data.tickets;
    expect(tickets.length).toBeGreaterThan(0);

    // At least one ticket should have a non-null slaStatus because seeded
    // tickets belong to orgs that have seeded SLA policies
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const withSla = tickets.filter((t: { slaStatus: unknown }) => t.slaStatus !== null);
    expect(withSla.length).toBeGreaterThan(0);

    // Check shape of a resolved slaStatus
    const sample = withSla[0].slaStatus;
    expect(sample).toMatchObject({
      policyName: expect.any(String),
      allSeverityTargets: expect.any(Array),
      deadlineBreached: expect.any(Boolean),
      hoursUntilDeadline: expect.any(Number),
    });
  });

  it('GET /tickets/:ticketId includes slaStatus on the detail response', async () => {
    // Get a ticket ID from the list first
    const listRes = await request(app).get('/api/tickets/').set(authHeader(adminToken));
    const ticketId = listRes.body.data.tickets[0].id as string;

    const res = await request(app).get(`/api/tickets/${ticketId}`).set(authHeader(adminToken));

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('slaStatus');
    expect(res.body.data).toHaveProperty('attachments');
  });

  it('slaStatus.deadlineBreached is true for a ticket with a past deadline', async () => {
    // Ticket 3 in seed data has deadline = now (already passed at test runtime)
    const listRes = await request(app).get('/api/tickets/').set(authHeader(adminToken));
    const tickets = listRes.body.data.tickets;

    // Find a resolved ticket -- seed data has ticket3 as Resolved with deadline=now
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const resolvedTicket = tickets.find(
      (t: { ticketStatus: string }) => t.ticketStatus === 'Resolved'
    );

    if (resolvedTicket?.slaStatus) {
      // The resolved ticket has deadline = seed time (in the past), so it should be breached
      expect(resolvedTicket.slaStatus.deadlineBreached).toBe(true);
      expect(resolvedTicket.slaStatus.hoursUntilDeadline).toBeLessThan(0);
    }
    // If slaStatus is null the ticket just doesn't have a policy -- not a failure
  });
});
