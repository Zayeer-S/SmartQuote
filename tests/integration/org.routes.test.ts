/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { bootstrapApplication } from '../../src/server/bootstrap/app.bootstrap.js';
import { ORG_ENDPOINTS } from '../../src/shared/constants/endpoints.js';
import { ORG_ROLES } from '../../src/shared/constants/lookup-values.js';
import { USERS } from '../constants/test.user.credentials.js';
import '../helpers/setup.integration.js';

const BASE = `/api${ORG_ENDPOINTS.BASE}`;

let app: Express;
let adminToken: string;
let testOrgId: string;
let testMemberUserId: string;

async function loginAs(email: string, password: string): Promise<string> {
  const res = await request(app).post('/api/auth/login').send({ email, password });
  return res.body.data.token as string;
}

beforeAll(async () => {
  const bootstrap = await bootstrapApplication({ runBackgroundJobs: false });
  app = bootstrap.app;

  adminToken = await loginAs(USERS.ADMIN.EMAIL, USERS.ADMIN.PASSWORD);

  // Create a dedicated org for this test file
  const orgRes = await request(app)
    .post(BASE + ORG_ENDPOINTS.CREATE)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name: `Org routes test org ${String(Date.now())}` });
  testOrgId = orgRes.body.data.id as string;

  // Add CUSTOMER4_NO_ORG as a member (they have no org in seed data)
  const addRes = await request(app)
    .post(BASE + ORG_ENDPOINTS.ADD_MEMBER(testOrgId))
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ email: USERS.CUSTOMER4_NO_ORG.EMAIL });
  testMemberUserId = addRes.body.data.userId as string;
});

describe(`PATCH /orgs/:orgId/members/:userId/role`, () => {
  async function resetToMember(): Promise<void> {
    await request(app)
      .patch(BASE + ORG_ENDPOINTS.UPDATE_MEMBER_ROLE(testOrgId, testMemberUserId))
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: ORG_ROLES.MEMBER });
  }

  it('promotes a Member to Manager and returns the updated membership', async () => {
    await resetToMember();

    const res = await request(app)
      .patch(BASE + ORG_ENDPOINTS.UPDATE_MEMBER_ROLE(testOrgId, testMemberUserId))
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: ORG_ROLES.MANAGER });

    expect(res.status).toBe(200);
    expect(res.body.data.userId).toBe(testMemberUserId);
    expect(res.body.data.orgRoleId).toBeDefined();
  });

  it('demotes a Manager back to Member', async () => {
    // Ensure Manager first
    await request(app)
      .patch(BASE + ORG_ENDPOINTS.UPDATE_MEMBER_ROLE(testOrgId, testMemberUserId))
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: ORG_ROLES.MANAGER });

    const res = await request(app)
      .patch(BASE + ORG_ENDPOINTS.UPDATE_MEMBER_ROLE(testOrgId, testMemberUserId))
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: ORG_ROLES.MEMBER });

    expect(res.status).toBe(200);
    expect(res.body.data.userId).toBe(testMemberUserId);
  });

  it('returns 422 when the member already has the target role', async () => {
    await resetToMember();

    const res = await request(app)
      .patch(BASE + ORG_ENDPOINTS.UPDATE_MEMBER_ROLE(testOrgId, testMemberUserId))
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: ORG_ROLES.MEMBER });

    expect(res.status).toBe(422);
  });

  it('returns 400 for an invalid role value', async () => {
    const res = await request(app)
      .patch(BASE + ORG_ENDPOINTS.UPDATE_MEMBER_ROLE(testOrgId, testMemberUserId))
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'SuperAdmin' });

    expect(res.status).toBe(400);
  });

  it('returns 400 when role field is missing', async () => {
    const res = await request(app)
      .patch(BASE + ORG_ENDPOINTS.UPDATE_MEMBER_ROLE(testOrgId, testMemberUserId))
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});

    expect(res.status).toBe(400);
  });

  it('returns 401 for an unauthenticated request', async () => {
    const res = await request(app)
      .patch(BASE + ORG_ENDPOINTS.UPDATE_MEMBER_ROLE(testOrgId, testMemberUserId))
      .send({ role: ORG_ROLES.MANAGER });

    expect(res.status).toBe(401);
  });

  it('returns 404 when the target user is not a member of this org', async () => {
    const nonMemberId = '00000000-0000-0000-0000-000000000000';

    const res = await request(app)
      .patch(BASE + ORG_ENDPOINTS.UPDATE_MEMBER_ROLE(testOrgId, nonMemberId))
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: ORG_ROLES.MANAGER });

    expect(res.status).toBe(404);
  });

  it('returns 404 when the org does not exist', async () => {
    const nonExistentOrgId = '00000000-0000-0000-0000-000000000000';

    const res = await request(app)
      .patch(BASE + ORG_ENDPOINTS.UPDATE_MEMBER_ROLE(nonExistentOrgId, testMemberUserId))
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: ORG_ROLES.MANAGER });

    expect(res.status).toBe(404);
  });
});
