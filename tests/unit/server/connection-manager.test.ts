/* eslint-disable @typescript-eslint/unbound-method */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConnectionManager } from '../../../src/server/realtime/connection-manager';
import type { WebSocket } from 'ws';
import type { UserId } from '../../../src/server/database/types/ids';

function makeMockWs(readyState = 1): WebSocket {
  return {
    readyState,
    send: vi.fn((_data, cb?: (err?: Error) => void) => {
      cb?.();
    }),
  } as unknown as WebSocket;
}

const USER_A = 'user-a' as UserId;
const USER_B = 'user-b' as UserId;
const CONN_1 = 'conn-1';
const CONN_2 = 'conn-2';
const CONN_3 = 'conn-3';

describe('ConnectionManager', () => {
  let manager: ConnectionManager;

  beforeEach(() => {
    manager = new ConnectionManager();
  });

  // ---------------------------------------------------------------------------
  // register / deregister
  // ---------------------------------------------------------------------------

  describe('register', () => {
    it('increments connection count', () => {
      manager.register(CONN_1, makeMockWs(), USER_A);
      expect(manager.getConnectionCount()).toBe(1);
    });

    it('tracks multiple connections for the same user', () => {
      manager.register(CONN_1, makeMockWs(), USER_A);
      manager.register(CONN_2, makeMockWs(), USER_A);
      expect(manager.getConnectionCount()).toBe(2);
    });

    it('returns the userId for a registered connection', () => {
      manager.register(CONN_1, makeMockWs(), USER_A);
      expect(manager.getUserId(CONN_1)).toBe(USER_A);
    });
  });

  describe('deregister', () => {
    it('decrements connection count', () => {
      manager.register(CONN_1, makeMockWs(), USER_A);
      manager.deregister(CONN_1);
      expect(manager.getConnectionCount()).toBe(0);
    });

    it('is a no-op for an unknown connection id', () => {
      expect(() => {
        manager.deregister('does-not-exist');
      }).not.toThrow();
    });

    it('returns undefined for getUserId after deregistration', () => {
      manager.register(CONN_1, makeMockWs(), USER_A);
      manager.deregister(CONN_1);
      expect(manager.getUserId(CONN_1)).toBeUndefined();
    });

    it('removes room membership when deregistering', () => {
      const ws = makeMockWs();
      manager.register(CONN_1, ws, USER_A);
      manager.subscribeToRooms(CONN_1, ['ticket:abc']);
      manager.deregister(CONN_1);
      // After deregister, broadcasting to that room should not call send
      manager.broadcastToRoom('ticket:abc', 'ping');
      expect(ws.send).not.toHaveBeenCalled();
    });

    it('cleans up userIdx when last connection for a user is removed', () => {
      manager.register(CONN_1, makeMockWs(), USER_A);
      manager.deregister(CONN_1);
      // sendToUser should be a no-op -- no error, no send
      expect(() => {
        manager.sendToUser(USER_A, 'msg');
      }).not.toThrow();
    });
  });

  // ---------------------------------------------------------------------------
  // subscribeToRooms / unsubscribeFromRooms
  // ---------------------------------------------------------------------------

  describe('subscribeToRooms', () => {
    it('returns all admitted rooms', () => {
      manager.register(CONN_1, makeMockWs(), USER_A);
      const admitted = manager.subscribeToRooms(CONN_1, ['ticket:abc', 'admin:dashboard']);
      expect(admitted).toEqual(['ticket:abc', 'admin:dashboard']);
    });

    it('returns empty array for an unknown connection', () => {
      const admitted = manager.subscribeToRooms('ghost', ['ticket:abc']);
      expect(admitted).toEqual([]);
    });

    it('allows a connection to subscribe to multiple rooms', () => {
      manager.register(CONN_1, makeMockWs(), USER_A);
      manager.subscribeToRooms(CONN_1, ['ticket:abc', 'org:org-1', 'user:user-a']);
      // Each room should reach the connection
      const ws = makeMockWs();
      manager.register(CONN_1, ws, USER_A); // re-register same id won't clear rooms, but start fresh for broadcast
    });
  });

  describe('unsubscribeFromRooms', () => {
    it('removes the connection from the room so broadcast skips it', () => {
      const ws = makeMockWs();
      manager.register(CONN_1, ws, USER_A);
      manager.subscribeToRooms(CONN_1, ['ticket:abc']);
      manager.unsubscribeFromRooms(CONN_1, ['ticket:abc']);
      manager.broadcastToRoom('ticket:abc', 'hello');
      expect(ws.send).not.toHaveBeenCalled();
    });

    it('is a no-op for an unknown connection', () => {
      expect(() => {
        manager.unsubscribeFromRooms('ghost', ['ticket:abc']);
      }).not.toThrow();
    });

    it('only removes the specified room, leaving others intact', () => {
      const ws = makeMockWs();
      manager.register(CONN_1, ws, USER_A);
      manager.subscribeToRooms(CONN_1, ['ticket:abc', 'ticket:xyz']);
      manager.unsubscribeFromRooms(CONN_1, ['ticket:abc']);

      manager.broadcastToRoom('ticket:xyz', 'still-here');
      expect(ws.send).toHaveBeenCalledTimes(1);
    });
  });

  // ---------------------------------------------------------------------------
  // broadcastToRoom
  // ---------------------------------------------------------------------------

  describe('broadcastToRoom', () => {
    it('sends a message to all connections in a room', () => {
      const ws1 = makeMockWs();
      const ws2 = makeMockWs();
      manager.register(CONN_1, ws1, USER_A);
      manager.register(CONN_2, ws2, USER_B);
      manager.subscribeToRooms(CONN_1, ['ticket:t1']);
      manager.subscribeToRooms(CONN_2, ['ticket:t1']);

      manager.broadcastToRoom('ticket:t1', 'event-payload');

      expect(ws1.send).toHaveBeenCalledWith('event-payload', expect.any(Function));
      expect(ws2.send).toHaveBeenCalledWith('event-payload', expect.any(Function));
    });

    it('does not send to connections not subscribed to the room', () => {
      const ws1 = makeMockWs();
      const ws2 = makeMockWs();
      manager.register(CONN_1, ws1, USER_A);
      manager.register(CONN_2, ws2, USER_B);
      manager.subscribeToRooms(CONN_1, ['ticket:t1']);
      // CONN_2 is in a different room

      manager.broadcastToRoom('ticket:t1', 'event-payload');

      expect(ws1.send).toHaveBeenCalledTimes(1);
      expect(ws2.send).not.toHaveBeenCalled();
    });

    it('is a no-op for an empty room', () => {
      expect(() => {
        manager.broadcastToRoom('ticket:nobody', 'msg');
      }).not.toThrow();
    });

    it('cleans up dead sockets inline during broadcast', () => {
      const deadWs = makeMockWs(3 /* CLOSED */);
      const liveWs = makeMockWs(1);
      manager.register(CONN_1, deadWs, USER_A);
      manager.register(CONN_2, liveWs, USER_B);
      manager.subscribeToRooms(CONN_1, ['ticket:t1']);
      manager.subscribeToRooms(CONN_2, ['ticket:t1']);

      manager.broadcastToRoom('ticket:t1', 'msg');

      expect(deadWs.send).not.toHaveBeenCalled();
      expect(liveWs.send).toHaveBeenCalledTimes(1);
      // Dead connection should be cleaned up
      expect(manager.getUserId(CONN_1)).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // sendToUser
  // ---------------------------------------------------------------------------

  describe('sendToUser', () => {
    it('sends to all open connections for that user', () => {
      const ws1 = makeMockWs();
      const ws2 = makeMockWs();
      manager.register(CONN_1, ws1, USER_A);
      manager.register(CONN_2, ws2, USER_A);

      manager.sendToUser(USER_A, 'personal-msg');

      expect(ws1.send).toHaveBeenCalledWith('personal-msg', expect.any(Function));
      expect(ws2.send).toHaveBeenCalledWith('personal-msg', expect.any(Function));
    });

    it('does not send to other users', () => {
      const wsA = makeMockWs();
      const wsB = makeMockWs();
      manager.register(CONN_1, wsA, USER_A);
      manager.register(CONN_2, wsB, USER_B);

      manager.sendToUser(USER_A, 'msg');

      expect(wsA.send).toHaveBeenCalledTimes(1);
      expect(wsB.send).not.toHaveBeenCalled();
    });

    it('is a no-op for a user with no connections', () => {
      expect(() => {
        manager.sendToUser('ghost' as UserId, 'msg');
      }).not.toThrow();
    });

    it('skips closed sockets without throwing', () => {
      const closedWs = makeMockWs(3);
      const openWs = makeMockWs(1);
      manager.register(CONN_1, closedWs, USER_A);
      manager.register(CONN_2, openWs, USER_A);

      manager.sendToUser(USER_A, 'msg');

      expect(closedWs.send).not.toHaveBeenCalled();
      expect(openWs.send).toHaveBeenCalledTimes(1);
    });
  });

  // ---------------------------------------------------------------------------
  // getConnectionCount / getUserId
  // ---------------------------------------------------------------------------

  describe('getConnectionCount', () => {
    it('returns 0 on a fresh instance', () => {
      expect(manager.getConnectionCount()).toBe(0);
    });

    it('tracks count across multiple registers and deregisters', () => {
      manager.register(CONN_1, makeMockWs(), USER_A);
      manager.register(CONN_2, makeMockWs(), USER_B);
      manager.register(CONN_3, makeMockWs(), USER_A);
      expect(manager.getConnectionCount()).toBe(3);

      manager.deregister(CONN_2);
      expect(manager.getConnectionCount()).toBe(2);
    });
  });
});
