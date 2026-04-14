import { useCallback } from 'react';
import type { WsRoomId, WsServerMessage } from '../../../shared/contracts/realtime-contracts.js';
import { useWsSubscription } from '../useWsSubscription.js';

const TICKET_EVENTS = new Set(['ticket:created', 'ticket:assigned']);

/**
 * Subscribes to `room` and fires `onTicketEvent` whenever a ticket:created
 * or ticket:assigned event arrives.
 *
 * `onTicketEvent` is stabilized internally via useWsSubscription's handlerRef,
 * so callers do not need to memoize it.
 */
export function useTicketWsSubscription(room: WsRoomId, onTicketEvent: () => void): void {
  const handler = useCallback(
    (msg: WsServerMessage) => {
      if (TICKET_EVENTS.has(msg.type)) onTicketEvent();
    },
    [onTicketEvent]
  );

  useWsSubscription(room, handler);
}
