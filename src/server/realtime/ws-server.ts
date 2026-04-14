import { WebSocketServer, type WebSocket } from 'ws';
import type { Server } from 'http';
import { randomUUID } from 'crypto';
import type { ConnectionManager } from './connection-manager.js';
import type { RoomResolver } from './room-resolver.js';
import type { SessionService } from '../services/auth/session.service.js';
import type { WsClientMessage } from '../../shared/contracts/realtime-contracts.js';
import { registerCommentHandlers } from './handlers.js';

function send(ws: WebSocket, payload: unknown): void {
  if (ws.readyState === 1 /* OPEN */) {
    ws.send(JSON.stringify(payload));
  }
}

export function createWsServer(
  httpServer: Server,
  connectionManager: ConnectionManager,
  roomResolver: RoomResolver,
  sessionService: SessionService
): WebSocketServer {
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // TODO: REGISTER REMAINING HANDLERS
  registerCommentHandlers(connectionManager);

  wss.on('connection', (ws) => {
    const connectionId = randomUUID();
    let authenticated = false;

    // Each connection must authenticate within 10s or be closed
    const authTimeout = setTimeout(() => {
      if (!authenticated) {
        send(ws, { type: 'auth:error', message: 'Authentication timeout' });
        ws.close();
      }
    }, 10_000);

    ws.on('message', (raw) => {
      let msg: WsClientMessage;
      try {
        msg = JSON.parse((raw as Buffer).toString('utf-8')) as WsClientMessage;
      } catch {
        send(ws, { type: 'error', message: 'Invalid JSON' });
        return;
      }

      void handleMessage(msg);
    });

    ws.on('close', () => {
      clearTimeout(authTimeout);
      connectionManager.deregister(connectionId);
    });

    ws.on('error', (err) => {
      console.error(`[WS] error on ${connectionId}:`, err);
    });

    async function handleMessage(msg: WsClientMessage): Promise<void> {
      if (msg.type === 'auth') {
        if (authenticated) return;

        try {
          const session = await sessionService.getSession(msg.token as never);
          if (!session) {
            send(ws, { type: 'auth:error', message: 'Invalid or expired token' });
            ws.close();
            return;
          }

          clearTimeout(authTimeout);
          authenticated = true;
          connectionManager.register(connectionId, ws, session.user_id);
          send(ws, { type: 'auth:ack', userId: String(session.user_id) });
        } catch (err) {
          console.error('[WS] auth error:', err);
          send(ws, { type: 'auth:error', message: 'Authentication failed' });
          ws.close();
        }
        return;
      }

      if (!authenticated) {
        send(ws, { type: 'auth:error', message: 'Not authenticated' });
        return;
      }

      if (msg.type === 'subscribe') {
        const userId = connectionManager.getUserId(connectionId);
        if (!userId) return;

        const permitted = await roomResolver.resolvePermitted(userId, msg.rooms);
        const admitted = connectionManager.subscribeToRooms(connectionId, permitted);
        send(ws, { type: 'subscribe:ack', rooms: admitted });
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (msg.type === 'unsubscribe') {
        connectionManager.unsubscribeFromRooms(connectionId, msg.rooms);
        return;
      }
    }
  });

  console.log('[WS] WebSocket server ready on /ws');
  return wss;
}
