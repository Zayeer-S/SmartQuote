import type { WebSocket } from 'ws';
import type { UserId } from '../database/types/ids.js';
import type { WsRoomId } from '../../shared/contracts/realtime-contracts.js';

export interface ManagedConnection {
  ws: WebSocket;
  userId: UserId;
  rooms: Set<WsRoomId>;
  connectedAt: Date;
}

/**
 * Tracks all authenticated WebSocket connections.
 *
 * Responsibilities:
 *   - Register / deregister connections on open/close
 *   - Subscribe a connection to rooms after auth
 *   - Broadcast a serialized message to all connections in a room
 */
export class ConnectionManager {
  /** connectionId => connection metadata */
  private connections = new Map<string, ManagedConnection>();
  /** roomId => set of connectionIds */
  private rooms = new Map<WsRoomId, Set<string>>();
  /** userId => set of connectionIds (a user may have multiple tabs open) */
  private userIdx = new Map<string, Set<string>>();

  register(connectionId: string, ws: WebSocket, userId: UserId): void {
    this.connections.set(connectionId, {
      ws,
      userId,
      rooms: new Set(),
      connectedAt: new Date(),
    });

    const existing = this.userIdx.get(userId as string) ?? new Set<string>();
    existing.add(connectionId);
    this.userIdx.set(userId as string, existing);

    console.log(`[WS] registered connection ${connectionId} for user ${String(userId)}`);
  }

  deregister(connectionId: string): void {
    const conn = this.connections.get(connectionId);
    if (!conn) return;

    for (const room of conn.rooms) this.rooms.get(room)?.delete(connectionId);

    const userConns = this.userIdx.get(conn.userId as string);
    if (userConns) {
      userConns.delete(connectionId);
      if (userConns.size === 0) this.userIdx.delete(conn.userId as string);
    }

    this.connections.delete(connectionId);
    console.log(`[WS] deregistered connection ${connectionId}`);
  }

  getConnection(connectionId: string): ManagedConnection | undefined {
    return this.connections.get(connectionId);
  }

  subscribeToRooms(connectionId: string, rooms: WsRoomId[]): WsRoomId[] {
    const conn = this.connections.get(connectionId);
    if (!conn) return [];

    const admitted: WsRoomId[] = [];
    for (const room of rooms) {
      conn.rooms.add(room);

      const roomSet = this.rooms.get(room) ?? new Set<string>();
      roomSet.add(connectionId);
      this.rooms.set(room, roomSet);

      admitted.push(room);
    }

    return admitted;
  }

  unsubscribeFromRooms(connectionId: string, rooms: WsRoomId[]): void {
    const conn = this.connections.get(connectionId);
    if (!conn) return;

    for (const room of rooms) {
      conn.rooms.delete(room);
      this.rooms.get(room)?.delete(connectionId);
    }
  }

  /**
   * Broadcast a pre-serialized JSON string to all connections in a room.
   * Dead sockets are cleaned up inline.
   */
  broadcastToRoom(room: WsRoomId, message: string): void {
    const connectionIds = this.rooms.get(room);
    if (!connectionIds || connectionIds.size === 0) return;

    const dead: string[] = [];

    for (const id of connectionIds) {
      const conn = this.connections.get(id);
      if (!conn) {
        dead.push(id);
        continue;
      }

      if (conn.ws.readyState !== 1 /** OPEN */) {
        dead.push(id);
        continue;
      }

      conn.ws.send(message, (err) => {
        if (err) console.error(`[WS] send error on ${id}:`, err);
      });
    }

    for (const id of dead) this.deregister(id);
  }

  /**
   * Send a pre-serialized JSON string directly to all connections
   * belonging to a specific user (e.g. personal notifications).
   */
  sendToUser(userId: UserId, message: string): void {
    const connectionIds = this.userIdx.get(userId as string);
    if (!connectionIds) return;

    for (const id of connectionIds) {
      const conn = this.connections.get(id);
      if (conn?.ws.readyState !== 1 /** OPEN */) continue;

      conn.ws.send(message, (err) => {
        if (err) console.error(`[WS] send error on ${id}:`, err);
      });
    }
  }

  getUserId(connectionId: string): UserId | undefined {
    return this.connections.get(connectionId)?.userId;
  }

  getConnectionCount(): number {
    return this.connections.size;
  }
}
