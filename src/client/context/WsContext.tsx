import React, { useCallback, useEffect, useRef, useState } from 'react';
import { tokenStorage } from '../lib/storage/tokenStorage.js';
import { frontEnv } from '../config/env.frontend.js';
import {
  WsContext,
  type WsContextValue,
  type WsMessageHandler,
  type WsProviderProps,
  type WsStatus,
} from './ws.context.types.js';
import type { WsRoomId, WsServerMessage } from '../../shared/contracts/realtime-contracts.js';

const RECONNECT_DELAY_MS = 3_000;
const MAX_RECONNECT_ATTEMPTS = 5;

export const WsProvider: React.FC<WsProviderProps> = ({ children }) => {
  const [status, setStatus] = useState<WsStatus>('connecting');

  /** room => set of handlers registered for that room */
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-arguments
  const handlersRef = useRef<Map<WsRoomId, Set<WsMessageHandler>>>(new Map());
  /** rooms the server has confirmed us into */
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-arguments
  const admittedRoomsRef = useRef<Set<WsRoomId>>(new Set());
  /** rooms requested before/after ready -- flushed on auth:ack */
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-arguments
  const pendingRoomsRef = useRef<Set<WsRoomId>>(new Set());

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Prevent reconnect loop after intentional teardown (logout) */
  const intentionalCloseRef = useRef(false);

  const sendRaw = useCallback((payload: unknown): void => {
    const ws = wsRef.current;
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload));
    }
  }, []);

  const flushPendingRooms = useCallback((): void => {
    if (pendingRoomsRef.current.size === 0) return;
    const rooms = [...pendingRoomsRef.current];
    sendRaw({ type: 'subscribe', rooms });
    pendingRoomsRef.current.clear();
  }, [sendRaw]);

  const connect = useCallback((): void => {
    const token = tokenStorage.get();
    if (!token) return;

    intentionalCloseRef.current = false;
    const ws = new WebSocket(frontEnv.VITE_WS_URL);
    wsRef.current = ws;
    setStatus('connecting');

    ws.onopen = () => {
      setStatus('authenticating');
      ws.send(JSON.stringify({ type: 'auth', token }));
    };

    ws.onmessage = (event: MessageEvent<string>) => {
      let msg: WsServerMessage;
      try {
        msg = JSON.parse(event.data) as WsServerMessage;
      } catch {
        return;
      }

      if (msg.type === 'auth:ack') {
        reconnectAttemptsRef.current = 0;
        admittedRoomsRef.current.clear();
        setStatus('ready');
        flushPendingRooms();
        return;
      }

      if (msg.type === 'subscribe:ack') {
        for (const room of msg.rooms) admittedRoomsRef.current.add(room);
        return;
      }

      if (msg.type === 'auth:error' || msg.type === 'error') {
        console.error('[WS]', msg.message);
        setStatus('error');
        return;
      }

      // Dispatch to registered room handlers
      // msg.type for domain events matches the room prefix (e.g. 'comment:created' -> 'ticket:<id>')
      // We fan out to all handlers across all rooms and let each handler filter by type
      for (const handlers of handlersRef.current.values()) {
        for (const handler of handlers) handler(msg);
      }
    };

    ws.onclose = () => {
      setStatus('closed');
      admittedRoomsRef.current.clear();
      if (intentionalCloseRef.current) return;
      if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
        console.error('[WS] max reconnect attempts reached');
        setStatus('error');
        return;
      }
      reconnectAttemptsRef.current++;
      console.warn(`[WS] reconnecting (attempt ${String(reconnectAttemptsRef.current)})...`);
      reconnectTimerRef.current = setTimeout(connect, RECONNECT_DELAY_MS);
    };

    ws.onerror = (err) => {
      console.error('[WS] socket error:', err);
    };
  }, [flushPendingRooms]);

  // Connect on mount if a token exists; tear down on unmount
  useEffect(() => {
    if (tokenStorage.exists()) connect();

    return () => {
      intentionalCloseRef.current = true;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      wsRef.current?.close();
    };
    // connect is stable (useCallback with no deps that change)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const subscribe = useCallback(
    (room: WsRoomId, handler: WsMessageHandler): void => {
      const existing = handlersRef.current.get(room) ?? new Set();
      existing.add(handler);
      handlersRef.current.set(room, existing);

      if (!admittedRoomsRef.current.has(room)) {
        if (status === 'ready') {
          sendRaw({ type: 'subscribe', rooms: [room] });
          admittedRoomsRef.current.add(room);
        } else {
          pendingRoomsRef.current.add(room);
        }
      }
    },
    [status, sendRaw]
  );

  const unsubscribe = useCallback((room: WsRoomId, handler: WsMessageHandler): void => {
    const handlers = handlersRef.current.get(room);
    if (!handlers) return;

    handlers.delete(handler);

    if (handlers.size === 0) {
      handlersRef.current.delete(room);
      admittedRoomsRef.current.delete(room);
      sendRaw({ type: 'unsubscribe', rooms: [room] });
    }
    // sendRaw is stable
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value: WsContextValue = { status, subscribe, unsubscribe };

  return <WsContext.Provider value={value}>{children}</WsContext.Provider>;
};
