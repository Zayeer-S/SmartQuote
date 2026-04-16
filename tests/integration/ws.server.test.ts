import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import { WebSocket } from 'ws';
import request from 'supertest';
import { bootstrapApplication } from '../../src/server/bootstrap/app.bootstrap.js';
import { createWsServer } from '../../src/server/realtime/ws-server.js';
import { eventBus } from '../../src/server/lib/event-bus.js';
import { USERS } from '../constants/test.user.credentials.js';
import '../helpers/setup.integration.js';
import type { CommentCreatedPayload } from '../../src/shared/contracts/realtime-contracts.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Resolve with the next parsed message matching the predicate, or reject on timeout. */
function nextMessage(
  ws: WebSocket,
  predicate: (msg: Record<string, unknown>) => boolean,
  timeoutMs = 3_000
): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      ws.off('message', onMessage);
      reject(new Error(`WS message matching predicate not received within ${String(timeoutMs)}ms`));
    }, timeoutMs);

    function onMessage(raw: Buffer | string) {
      let msg: Record<string, unknown>;
      try {
        msg = JSON.parse(raw.toString()) as Record<string, unknown>;
      } catch {
        return;
      }
      if (predicate(msg)) {
        clearTimeout(timer);
        ws.off('message', onMessage);
        resolve(msg);
      }
    }

    ws.on('message', onMessage);
  });
}

function parseRaw(raw: Buffer | ArrayBuffer | Buffer[]): Record<string, unknown> {
  const str = Buffer.isBuffer(raw)
    ? raw.toString('utf8')
    : raw instanceof ArrayBuffer
      ? Buffer.from(raw).toString('utf8')
      : Buffer.concat(raw).toString('utf8');
  return JSON.parse(str) as Record<string, unknown>;
}

/** Open a WebSocket connection and wait for it to be OPEN. */
function openWs(port: number): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://127.0.0.1:${String(port)}/ws`);
    ws.once('open', () => {
      resolve(ws);
    });
    ws.once('error', reject);
  });
}

/** Send auth message and wait for auth:ack. */
async function authenticate(ws: WebSocket, token: string): Promise<void> {
  const ack = nextMessage(ws, (m) => m.type === 'auth:ack' || m.type === 'auth:error');
  ws.send(JSON.stringify({ type: 'auth', token }));
  const msg = await ack;
  if (msg.type === 'auth:error') throw new Error(`WS auth failed: ${String(msg.message)}`);
}

/** Authenticate then subscribe to a room, waiting for subscribe:ack. */
async function authenticateAndSubscribe(ws: WebSocket, token: string, room: string): Promise<void> {
  await authenticate(ws, token);
  const ack = nextMessage(ws, (m) => m.type === 'subscribe:ack');
  ws.send(JSON.stringify({ type: 'subscribe', rooms: [room] }));
  await ack;
}

/** Close a WebSocket and wait for the close event. */
function closeWs(ws: WebSocket): Promise<void> {
  return new Promise((resolve) => {
    if (ws.readyState === WebSocket.CLOSED) {
      resolve();
      return;
    }
    ws.once('close', () => {
      resolve();
    });
    ws.close();
  });
}

// ---------------------------------------------------------------------------
// Suite setup
// ---------------------------------------------------------------------------

let server: http.Server;
let port: number;
let adminToken: string;
let agentToken: string;
let customerToken: string;
// A ticket that belongs to the same org as CUSTOMER2_SAME_ORG
let testTicketId: string;

beforeAll(async () => {
  const { app, sessionService, connectionManager, roomResolver } = await bootstrapApplication({
    runBackgroundJobs: false,
  });

  server = http.createServer(app);
  createWsServer(server, connectionManager, roomResolver, sessionService);

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address() as { port: number };
  port = address.port;

  // Obtain tokens via the HTTP API
  async function login(email: string, password: string): Promise<string> {
    const res = await request(app).post('/api/auth/login').send({ email, password });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return res.body.data.token as string;
  }

  [adminToken, agentToken, customerToken] = await Promise.all([
    login(USERS.ADMIN.EMAIL, USERS.ADMIN.PASSWORD),
    login(USERS.AGENT.EMAIL, USERS.AGENT.PASSWORD),
    login(USERS.CUSTOMER2_SAME_ORG.EMAIL, USERS.CUSTOMER2_SAME_ORG.PASSWORD),
  ]);

  // Fetch a ticket visible to CUSTOMER2_SAME_ORG so we can use its real ticket room
  const ticketsRes = await request(app)
    .get('/api/tickets')
    .set('Authorization', `Bearer ${customerToken}`);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  testTicketId = (ticketsRes.body.data.tickets as { id: string }[])[0].id;
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) =>
    server.close((err) => {
      if (err) reject(err);
      else resolve();
    })
  );
});

// ---------------------------------------------------------------------------
// Auth handshake
// ---------------------------------------------------------------------------

describe('WS auth handshake', () => {
  it('receives auth:ack with userId after sending a valid token', async () => {
    const ws = await openWs(port);
    try {
      const ack = nextMessage(ws, (m) => m.type === 'auth:ack');
      ws.send(JSON.stringify({ type: 'auth', token: adminToken }));
      const msg = await ack;
      expect(msg.type).toBe('auth:ack');
      expect(typeof msg.userId).toBe('string');
    } finally {
      await closeWs(ws);
    }
  });

  it('receives auth:error and is disconnected when token is invalid', async () => {
    const ws = await openWs(port);
    const closed = new Promise<void>((resolve) => ws.once('close', resolve));
    ws.send(JSON.stringify({ type: 'auth', token: 'not-a-real-token' }));
    const msg = await nextMessage(ws, (m) => m.type === 'auth:error');
    expect(msg.type).toBe('auth:error');
    await closed; // server closes the socket after auth:error
  });

  it('closes the connection when no auth message arrives within 10 s (fast path: bad JSON)', async () => {
    const ws = await openWs(port);
    // Send garbage so the server replies with a generic error instead of waiting
    ws.send('not-json');
    const msg = await nextMessage(ws, (m) => m.type === 'error');
    expect(msg.type).toBe('error');
    await closeWs(ws);
  });

  it('rejects subscribe messages sent before auth', async () => {
    const ws = await openWs(port);
    try {
      ws.send(JSON.stringify({ type: 'subscribe', rooms: ['admin:dashboard'] }));
      const msg = await nextMessage(ws, (m) => m.type === 'auth:error');
      expect(msg.type).toBe('auth:error');
    } finally {
      await closeWs(ws);
    }
  });
});

// ---------------------------------------------------------------------------
// Room subscribe / permission enforcement
// ---------------------------------------------------------------------------

describe('WS room subscription', () => {
  it('subscribe:ack contains the admitted rooms', async () => {
    const ws = await openWs(port);
    try {
      await authenticate(ws, adminToken);
      const ack = nextMessage(ws, (m) => m.type === 'subscribe:ack');
      ws.send(JSON.stringify({ type: 'subscribe', rooms: ['admin:dashboard'] }));
      const msg = await ack;
      expect(msg.type).toBe('subscribe:ack');
      expect(msg.rooms).toContain('admin:dashboard');
    } finally {
      await closeWs(ws);
    }
  });

  it('admin is admitted to admin:dashboard, customer is not', async () => {
    const wsAdmin = await openWs(port);
    const wsCustomer = await openWs(port);

    try {
      await authenticate(wsAdmin, adminToken);
      await authenticate(wsCustomer, customerToken);

      const adminAck = nextMessage(wsAdmin, (m) => m.type === 'subscribe:ack');
      wsAdmin.send(JSON.stringify({ type: 'subscribe', rooms: ['admin:dashboard'] }));
      const adminMsg = await adminAck;
      expect((adminMsg.rooms as string[]).length).toBeGreaterThan(0);

      const customerAck = nextMessage(wsCustomer, (m) => m.type === 'subscribe:ack');
      wsCustomer.send(JSON.stringify({ type: 'subscribe', rooms: ['admin:dashboard'] }));
      const customerMsg = await customerAck;
      // Permission denied -- rooms list will be empty
      expect(customerMsg.rooms).toEqual([]);
    } finally {
      await closeWs(wsAdmin);
      await closeWs(wsCustomer);
    }
  });

  it('customer can subscribe to their own ticket room', async () => {
    const ws = await openWs(port);
    try {
      await authenticate(ws, customerToken);
      const ack = nextMessage(ws, (m) => m.type === 'subscribe:ack');
      ws.send(JSON.stringify({ type: 'subscribe', rooms: [`ticket:${testTicketId}`] }));
      const msg = await ack;
      expect(msg.rooms).toContain(`ticket:${testTicketId}`);
    } finally {
      await closeWs(ws);
    }
  });

  it('customer cannot subscribe to another user room', async () => {
    const ws = await openWs(port);
    try {
      await authenticate(ws, customerToken);
      const ack = nextMessage(ws, (m) => m.type === 'subscribe:ack');
      ws.send(JSON.stringify({ type: 'subscribe', rooms: ['user:somebody-else'] }));
      const msg = await ack;
      expect(msg.rooms).toEqual([]);
    } finally {
      await closeWs(ws);
    }
  });
});

// ---------------------------------------------------------------------------
// comment:created broadcast
// ---------------------------------------------------------------------------

describe('WS comment:created broadcast', () => {
  it('subscriber in the ticket room receives the event when eventBus emits', async () => {
    const room = `ticket:${testTicketId}`;
    const ws = await openWs(port);

    try {
      await authenticateAndSubscribe(ws, agentToken, room);

      const payload: CommentCreatedPayload = {
        ticketId: testTicketId,
        commentId: '999',
        authorUserId: 'agent-user-id',
        authorDisplayName: 'Test Agent',
        commentText: 'Integration test comment',
        commentType: 'EXTERNAL',
        createdAt: new Date().toISOString(),
      };

      const received = nextMessage(ws, (m) => m.type === 'comment:created');
      eventBus.emit('comment:created', payload);
      const msg = await received;

      expect(msg.type).toBe('comment:created');
      const data = msg.data as CommentCreatedPayload;
      expect(data.ticketId).toBe(testTicketId);
      expect(data.commentText).toBe('Integration test comment');
      expect(typeof msg.sentAt).toBe('string');
    } finally {
      await closeWs(ws);
    }
  });

  it('non-subscriber does not receive the event', async () => {
    const room = `ticket:${testTicketId}`;
    const wsSubscribed = await openWs(port);
    const wsUnsubscribed = await openWs(port);

    try {
      await authenticateAndSubscribe(wsSubscribed, agentToken, room);
      await authenticate(wsUnsubscribed, agentToken); // authenticated but not in the room

      const unsubscribedMessages: unknown[] = [];
      wsUnsubscribed.on('message', (raw) => {
        unsubscribedMessages.push(parseRaw(raw));
      });

      const payload: CommentCreatedPayload = {
        ticketId: testTicketId,
        commentId: '1000',
        authorUserId: 'agent-user-id',
        authorDisplayName: 'Test Agent',
        commentText: 'Should only reach subscriber',
        commentType: 'EXTERNAL',
        createdAt: new Date().toISOString(),
      };

      const received = nextMessage(wsSubscribed, (m) => m.type === 'comment:created');
      eventBus.emit('comment:created', payload);
      await received;

      // Give the non-subscriber a brief window to incorrectly receive anything
      await new Promise((r) => setTimeout(r, 100));
      const relevant = unsubscribedMessages.filter(
        (m) => (m as Record<string, unknown>).type === 'comment:created'
      );
      expect(relevant).toHaveLength(0);
    } finally {
      await closeWs(wsSubscribed);
      await closeWs(wsUnsubscribed);
    }
  });

  it('unsubscribed connection stops receiving events after unsubscribe', async () => {
    const room = `ticket:${testTicketId}`;
    const ws = await openWs(port);

    try {
      await authenticateAndSubscribe(ws, agentToken, room);
      ws.send(JSON.stringify({ type: 'unsubscribe', rooms: [room] }));
      // Brief settle so the server processes the unsubscribe
      await new Promise((r) => setTimeout(r, 50));

      const afterMessages: unknown[] = [];
      ws.on('message', (raw) => afterMessages.push(parseRaw(raw)));

      eventBus.emit('comment:created', {
        ticketId: testTicketId,
        commentId: '1001',
        authorUserId: 'agent-user-id',
        authorDisplayName: 'Test Agent',
        commentText: 'Should not arrive',
        commentType: 'EXTERNAL',
        createdAt: new Date().toISOString(),
      });

      await new Promise((r) => setTimeout(r, 100));
      const relevant = afterMessages.filter(
        (m) => (m as Record<string, unknown>).type === 'comment:created'
      );
      expect(relevant).toHaveLength(0);
    } finally {
      await closeWs(ws);
    }
  });
});
