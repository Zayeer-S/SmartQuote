import { useEffect, useRef } from 'react';
import { WsRoomId, WsServerMessage } from '../../../shared/contracts/realtime-contracts';
import { useWs } from '../contexts/useWs';

/**
 * Subscribes to a WS room for the lifetime of the calling component.
 * onMessage is stabilized via ref so callers do not need to memoize it.
 */
export function useWsSubscription(room: WsRoomId, onMessage: (msg: WsServerMessage) => void): void {
  const { subscribe, unsubscribe } = useWs();
  const handlerRef = useRef(onMessage);

  useEffect(() => {
    handlerRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    const stableHandler = (msg: WsServerMessage): void => {
      handlerRef.current(msg);
    };
    subscribe(room, stableHandler);
    return () => {
      unsubscribe(room, stableHandler);
    };
  }, [room, subscribe, unsubscribe]);
}
