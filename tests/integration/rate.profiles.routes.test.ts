/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { bootstrapApplication } from '../../src/server/bootstrap/app.bootstrap';
import { AUTH_ENDPOINTS, RATE_PROFILE_ENDPOINTS } from '../../src/shared/constants/endpoints';
import {
  TICKET_TYPES,
  TICKET_SEVERITIES,
  BUSINESS_IMPACTS,
} from '../../src/shared/constants/lookup-values';
import { USERS } from '../constants/test.user.credentials';

const AUTH_BASE = `/api${AUTH_ENDPOINTS.BASE}`;
const BASE = `/api${RATE_PROFILE_ENDPOINTS.BASE}`;

const ADMIN = { email: USERS.ADMIN.EMAIL, password: USERS.ADMIN.PASSWORD };
const MANAGER = { email: USERS.MANAGER.EMAIL, password: USERS.MANAGER.PASSWORD };
const CUSTOMER = {
  email: USERS.CUSTOMER1_DIFF_ORG.EMAIL,
  password: USERS.CUSTOMER1_DIFF_ORG.PASSWORD,
};

async function login(
  app: Express,
  credentials: { email: string; password: string }
): Promise<string> {
  const res = await request(app).post(`${AUTH_BASE}${AUTH_ENDPOINTS.LOGIN}`).send(credentials);
  return res.body.data.token as string;
}

function validCreateBody(overrides = {}) {
  const now = new Date();
  const nextYear = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
  return {
    ticketType: TICKET_TYPES.SUPPORT,
    ticketSeverity: TICKET_SEVERITIES.LOW,
    businessImpact: BUSINESS_IMPACTS.MINOR,
    businessHoursRate: 80,
    afterHoursRate: 120,
    multiplier: 1.0,
    effectiveFrom: new Date(nextYear.getTime() + 1).toISOString(), // starts after seed profiles
    effectiveTo: new Date(nextYear.getTime() + 2 * 365 * 24 * 60 * 60 * 1000).toISOString(),
    ...overrides,
  };
}

let app: Express;
let adminToken: string;
let managerToken: string;
let customerToken: string;

beforeAll(async () => {
  app = await bootstrapApplication({ runBackgroundJobs: false });
  [adminToken, managerToken, customerToken] = await Promise.all([
    login(app, ADMIN),
    login(app, MANAGER),
    login(app, CUSTOMER),
  ]);
});

describe(`GET ${BASE}`, () => {
  it('returns 200 with profiles array for admin', async () => {
    const res = await request(app).get(BASE).set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.rateProfiles).toBeInstanceOf(Array);
    expect(res.body.data.rateProfiles.length).toBeGreaterThan(0);
  });

  it('returns profiles with resolved name fields, not raw IDs', async () => {
    const res = await request(app).get(BASE).set('Authorization', `Bearer ${adminToken}`);

    const profile = res.body.data.rateProfiles[0];
    expect(typeof profile.ticketType).toBe('string');
    expect(typeof profile.ticketSeverity).toBe('string');
    expect(typeof profile.businessImpact).toBe('string');
    expect(profile).not.toHaveProperty('ticketTypeId');
    expect(profile).not.toHaveProperty('ticketSeverityId');
    expect(profile).not.toHaveProperty('businessImpactId');
  });

  it('returns 401 with no token', async () => {
    const res = await request(app).get(BASE);
    expect(res.status).toBe(401);
  });

  it('returns 403 for customer role', async () => {
    const res = await request(app).get(BASE).set('Authorization', `Bearer ${customerToken}`);
    expect(res.status).toBe(403);
  });
});

describe(`POST ${BASE}`, () => {
  it('returns 201 with the created profile for admin', async () => {
    const body = validCreateBody();

    const res = await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(body);

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      ticketType: TICKET_TYPES.SUPPORT,
      ticketSeverity: TICKET_SEVERITIES.LOW,
      businessImpact: BUSINESS_IMPACTS.MINOR,
      businessHoursRate: 80,
      afterHoursRate: 120,
      multiplier: 1.0,
      isActive: true,
    });
  });

  it('returns 403 for manager role (Admin-only operation)', async () => {
    const res = await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${managerToken}`)
      .send(validCreateBody());

    expect(res.status).toBe(403);
  });

  it('returns 403 for customer role', async () => {
    const res = await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${customerToken}`)
      .send(validCreateBody());

    expect(res.status).toBe(403);
  });

  it('returns 401 with no token', async () => {
    const res = await request(app).post(BASE).send(validCreateBody());
    expect(res.status).toBe(401);
  });

  it('returns 400 when effectiveFrom >= effectiveTo', async () => {
    const now = new Date();
    const res = await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validCreateBody({ effectiveFrom: now.toISOString(), effectiveTo: now.toISOString() }));

    expect(res.status).toBe(400);
  });

  it('returns 400 for an invalid ticketType value', async () => {
    const res = await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validCreateBody({ ticketType: 'NotARealType' }));

    expect(res.status).toBe(400);
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ticketType: TICKET_TYPES.SUPPORT });

    expect(res.status).toBe(400);
  });

  it('returns 422 when an active overlapping profile already exists for the same combo', async () => {
    // Seed data already has SUPPORT + LOW + MINOR active for the current year.
    // Sending a create request that overlaps with it should fail.
    const now = new Date();
    const res = await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(
        validCreateBody({
          ticketType: TICKET_TYPES.SUPPORT,
          ticketSeverity: TICKET_SEVERITIES.LOW,
          businessImpact: BUSINESS_IMPACTS.MINOR,
          effectiveFrom: now.toISOString(),
          effectiveTo: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        })
      );

    expect(res.status).toBe(422);
  });
});

describe(`GET ${BASE}/:rateProfileId`, () => {
  it('returns 200 with the profile for admin', async () => {
    const listRes = await request(app).get(BASE).set('Authorization', `Bearer ${adminToken}`);

    const firstId = listRes.body.data.rateProfiles[0].id as number;

    const res = await request(app)
      .get(`${BASE}/${String(firstId)}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(firstId);
  });

  it('returns 404 for a non-existent profile', async () => {
    const res = await request(app)
      .get(`${BASE}/999999`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
  });

  it('returns 401 with no token', async () => {
    const res = await request(app).get(`${BASE}/1`);
    expect(res.status).toBe(401);
  });
});

describe(`PATCH ${BASE}/:rateProfileId`, () => {
  it('returns 200 with updated fields for admin', async () => {
    const listRes = await request(app).get(BASE).set('Authorization', `Bearer ${adminToken}`);

    const profile = listRes.body.data.rateProfiles[0];

    const res = await request(app)
      .patch(`${BASE}/${String(profile.id as number)}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ businessHoursRate: 999 });

    expect(res.status).toBe(200);
    expect(res.body.data.businessHoursRate).toBe(999);
  });

  it('returns 200 when updating effectiveFrom/effectiveTo to non-overlapping range on the same profile (regression: self-overlap false positive)', async () => {
    // This test guards against the bug where String(profile.id) !== String(excludeId)
    // caused the overlap check to match the profile against itself, producing a
    // spurious 422 even though no real conflict existed.
    const listRes = await request(app).get(BASE).set('Authorization', `Bearer ${adminToken}`);
    const profile = listRes.body.data.rateProfiles[0];

    const newFrom = new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000);
    const newTo = new Date(newFrom.getTime() + 365 * 24 * 60 * 60 * 1000);

    const res = await request(app)
      .patch(`${BASE}/${String(profile.id as number)}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        effectiveFrom: newFrom.toISOString(),
        effectiveTo: newTo.toISOString(),
      });

    expect(res.status).toBe(200);
    expect(new Date(res.body.data.effectiveFrom as string).getTime()).toBe(newFrom.getTime());
  });

  it('returns 422 when updating effectiveFrom/effectiveTo to a range that overlaps a different active profile for the same combo', async () => {
    // Create two non-overlapping profiles for the same combo, then try to
    // expand profile B's range so it overlaps profile A. Must be rejected.
    const now = new Date();
    const slotA_from = new Date(now.getTime() + 10 * 365 * 24 * 60 * 60 * 1000);
    const slotA_to = new Date(slotA_from.getTime() + 365 * 24 * 60 * 60 * 1000);
    const slotB_from = new Date(slotA_to.getTime() + 1);
    const slotB_to = new Date(slotB_from.getTime() + 365 * 24 * 60 * 60 * 1000);

    const comboOverrides = {
      ticketType: TICKET_TYPES.INCIDENT,
      ticketSeverity: TICKET_SEVERITIES.MEDIUM,
      businessImpact: BUSINESS_IMPACTS.MODERATE,
    };

    const createdA = await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(
        validCreateBody({
          ...comboOverrides,
          effectiveFrom: slotA_from.toISOString(),
          effectiveTo: slotA_to.toISOString(),
        })
      );
    expect(createdA.status).toBe(201);

    const createdB = await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(
        validCreateBody({
          ...comboOverrides,
          effectiveFrom: slotB_from.toISOString(),
          effectiveTo: slotB_to.toISOString(),
        })
      );
    expect(createdB.status).toBe(201);

    // Attempt to push B's effectiveFrom back into A's range
    const res = await request(app)
      .patch(`${BASE}/${String(createdB.body.data.id as number)}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ effectiveFrom: slotA_from.toISOString() });

    expect(res.status).toBe(422);
  });

  it('returns 404 for a non-existent profile', async () => {
    const res = await request(app)
      .patch(`${BASE}/999999`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ businessHoursRate: 100 });

    expect(res.status).toBe(404);
  });

  it('returns 401 with no token', async () => {
    const res = await request(app).patch(`${BASE}/1`).send({ businessHoursRate: 100 });
    expect(res.status).toBe(401);
  });
});

describe(`DELETE ${BASE}/:rateProfileId`, () => {
  it('returns 204 and deactivates the profile for admin', async () => {
    // Create a fresh profile to delete so we don't disturb other tests
    const created = await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(
        validCreateBody({
          ticketType: TICKET_TYPES.ENHANCEMENT,
          ticketSeverity: TICKET_SEVERITIES.CRITICAL,
          businessImpact: BUSINESS_IMPACTS.MINOR,
        })
      );

    const id = created.body.data.id as number;

    const res = await request(app)
      .delete(`${BASE}/${String(id)}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(204);

    // Verify profile still exists but is inactive
    const getRes = await request(app)
      .get(`${BASE}/${String(id)}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.data.isActive).toBe(false);
  });

  it('returns 403 for manager role', async () => {
    const res = await request(app)
      .delete(`${BASE}/1`)
      .set('Authorization', `Bearer ${managerToken}`);

    expect(res.status).toBe(403);
  });

  it('returns 404 for a non-existent profile', async () => {
    const res = await request(app)
      .delete(`${BASE}/999999`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
  });

  it('returns 401 with no token', async () => {
    const res = await request(app).delete(`${BASE}/1`);
    expect(res.status).toBe(401);
  });
});
