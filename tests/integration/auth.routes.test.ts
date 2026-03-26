/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { bootstrapApplication } from '../../src/server/bootstrap/app.bootstrap';
import { AUTH_ENDPOINTS } from '../../src/shared/constants/endpoints';
import { USERS } from '../constants/test.user.credentials';

const BASE = `/api${AUTH_ENDPOINTS.BASE}`;

const SEEDED_USER = {
  email: USERS.ADMIN.EMAIL,
  password: USERS.ADMIN.PASSWORD,
};

const INVALID_CREDENTIALS = {
  email: 'admin@example.com',
  password: 'WrongPass1!',
};

let app: Express;

beforeAll(async () => {
  app = await bootstrapApplication({ runBackgroundJobs: false });
});

describe(`POST ${BASE}${AUTH_ENDPOINTS.LOGIN}`, () => {
  it('returns 200 with a token and user data on valid credentials', async () => {
    const res = await request(app).post(`${BASE}${AUTH_ENDPOINTS.LOGIN}`).send(SEEDED_USER);

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      token: expect.any(String),
      user: {
        email: SEEDED_USER.email,
        role: { name: expect.any(String) },
      },
    });
  });

  it('returns 401 on wrong password', async () => {
    const res = await request(app).post(`${BASE}${AUTH_ENDPOINTS.LOGIN}`).send(INVALID_CREDENTIALS);

    expect(res.status).toBe(401);
  });

  it('returns 401 on non-existent email', async () => {
    const res = await request(app)
      .post(`${BASE}${AUTH_ENDPOINTS.LOGIN}`)
      .send({ email: 'nobody@example.com', password: 'Valid1!ab' });

    expect(res.status).toBe(401);
  });

  it('returns 400 on malformed request body', async () => {
    const res = await request(app)
      .post(`${BASE}${AUTH_ENDPOINTS.LOGIN}`)
      .send({ email: 'not-an-email', password: '' });

    expect(res.status).toBe(400);
  });

  it('returns 400 when body is missing entirely', async () => {
    const res = await request(app).post(`${BASE}${AUTH_ENDPOINTS.LOGIN}`).send({});

    expect(res.status).toBe(400);
  });

  it('does not leak password or sensitive fields in the response', async () => {
    const res = await request(app).post(`${BASE}${AUTH_ENDPOINTS.LOGIN}`).send(SEEDED_USER);

    expect(res.status).toBe(200);
    expect(JSON.stringify(res.body)).not.toContain(SEEDED_USER.password);
    expect(res.body.data?.user?.password).toBeUndefined();
  });
});

describe(`POST ${BASE}${AUTH_ENDPOINTS.LOGOUT}`, () => {
  it('returns 200 and invalidates a valid session', async () => {
    const loginRes = await request(app).post(`${BASE}${AUTH_ENDPOINTS.LOGIN}`).send(SEEDED_USER);
    const token = loginRes.body.data.token as string;

    const res = await request(app)
      .post(`${BASE}${AUTH_ENDPOINTS.LOGOUT}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  it('returns 401 when no Authorization header is provided', async () => {
    const res = await request(app).post(`${BASE}${AUTH_ENDPOINTS.LOGOUT}`);

    expect(res.status).toBe(401);
  });

  it('returns 401 when the token is invalid', async () => {
    const res = await request(app)
      .post(`${BASE}${AUTH_ENDPOINTS.LOGOUT}`)
      .set('Authorization', 'Bearer totally-fake-token');

    expect(res.status).toBe(401);
  });

  it('returns 401 when the same token is used twice (session already invalidated)', async () => {
    const loginRes = await request(app).post(`${BASE}${AUTH_ENDPOINTS.LOGIN}`).send(SEEDED_USER);
    const token = loginRes.body.data.token as string;

    await request(app)
      .post(`${BASE}${AUTH_ENDPOINTS.LOGOUT}`)
      .set('Authorization', `Bearer ${token}`);

    const secondLogout = await request(app)
      .post(`${BASE}${AUTH_ENDPOINTS.LOGOUT}`)
      .set('Authorization', `Bearer ${token}`);

    expect(secondLogout.status).toBe(401);
  });
});

describe(`GET ${BASE}${AUTH_ENDPOINTS.ME}`, () => {
  it('returns 200 with user data for a valid session', async () => {
    const loginRes = await request(app).post(`${BASE}${AUTH_ENDPOINTS.LOGIN}`).send(SEEDED_USER);
    const token = loginRes.body.data.token as string;

    const res = await request(app)
      .get(`${BASE}${AUTH_ENDPOINTS.ME}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      email: SEEDED_USER.email,
      role: { name: expect.any(String) },
    });
    expect(res.body.data.password).toBeUndefined();
  });

  it('returns 401 with no token', async () => {
    const res = await request(app).get(`${BASE}${AUTH_ENDPOINTS.ME}`);

    expect(res.status).toBe(401);
  });

  it('returns 401 after the session has been logged out', async () => {
    const loginRes = await request(app).post(`${BASE}${AUTH_ENDPOINTS.LOGIN}`).send(SEEDED_USER);
    const token = loginRes.body.data.token as string;

    await request(app)
      .post(`${BASE}${AUTH_ENDPOINTS.LOGOUT}`)
      .set('Authorization', `Bearer ${token}`);

    const res = await request(app)
      .get(`${BASE}${AUTH_ENDPOINTS.ME}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(401);
  });
});

// TODO CHANGE PASSWORD TESTS
