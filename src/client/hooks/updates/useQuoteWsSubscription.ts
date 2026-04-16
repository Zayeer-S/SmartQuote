import { useCallback } from 'react';
import type { WsServerMessage } from '../../../shared/contracts/realtime-contracts.js';
import { useWsSubscription } from './useWsSubscription.js';

const QUOTE_EVENTS = new Set([
  'quote:created',
  'quote:updated',
  'quote:approved-by-agent',
  'quote:approved-by-manager',
  'quote:approved-by-admin',
  'quote:approved-by-customer',
  'quote:rejected-by-manager',
]);

/**
 * Subscribes to the ticket room and fires onQuoteEvent whenever any quote
 * event arrives. The caller is responsible for refetching quotes and ticket
 * state inside onQuoteEvent.
 *
 * onQuoteEvent is stabilized internally via useWsSubscription's handlerRef,
 * so callers do not need to memoize it.
 */
export function useQuoteWsSubscription(ticketId: string, onQuoteEvent: () => void): void {
  const handler = useCallback(
    (msg: WsServerMessage) => {
      if (QUOTE_EVENTS.has(msg.type)) onQuoteEvent();
    },
    [onQuoteEvent]
  );

  useWsSubscription(`ticket:${ticketId}`, handler);
}
