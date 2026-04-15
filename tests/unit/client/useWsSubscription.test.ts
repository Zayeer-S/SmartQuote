import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import React from 'react';
import { useWsSubscription } from '../../../src/client/hooks/updates/useWsSubscription.ts';
import { WsContext, WsContextValue } from '../../../src/client/context/ws.context.types.ts';
import type {
  WsRoomId,
  WsServerMessage,
} from '../../../src/shared/contracts/realtime-contracts.ts';

function makeContextValue(overrides: Partial<WsContextValue> = {}): WsContextValue {
  return {
    status: 'ready',
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
    ...overrides,
  };
}

function wrapper(ctx: WsContextValue) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(WsContext.Provider, { value: ctx }, children);
  };
}

const ROOM: WsRoomId = 'ticket:test-123';

describe('useWsSubscription', () => {
  let ctx: WsContextValue;

  beforeEach(() => {
    ctx = makeContextValue();
  });

  it('calls subscribe with the room on mount', () => {
    const handler = vi.fn();
    renderHook(
      () => {
        useWsSubscription(ROOM, handler);
      },
      { wrapper: wrapper(ctx) }
    );
    expect(ctx.subscribe).toHaveBeenCalledWith(ROOM, expect.any(Function));
  });

  it('calls unsubscribe with the same handler on unmount', () => {
    const handler = vi.fn();
    const { unmount } = renderHook(
      () => {
        useWsSubscription(ROOM, handler);
      },
      {
        wrapper: wrapper(ctx),
      }
    );

    const subscribedHandler = vi.mocked(ctx.subscribe).mock.calls[0][1];
    unmount();

    expect(ctx.unsubscribe).toHaveBeenCalledWith(ROOM, subscribedHandler);
  });

  it('forwards incoming messages to the handler', () => {
    const handler = vi.fn();
    renderHook(
      () => {
        useWsSubscription(ROOM, handler);
      },
      { wrapper: wrapper(ctx) }
    );

    // Simulate the context calling back the stable handler
    const stableHandler = vi.mocked(ctx.subscribe).mock.calls[0][1];
    const msg = { type: 'ping' } as WsServerMessage;
    stableHandler(msg);

    expect(handler).toHaveBeenCalledWith(msg);
  });

  it('uses the latest handler ref without re-subscribing', () => {
    const handler1 = vi.fn();
    const handler2 = vi.fn();

    const { rerender } = renderHook(
      ({ h }: { h: (msg: WsServerMessage) => void }) => {
        useWsSubscription(ROOM, h);
      },
      { wrapper: wrapper(ctx), initialProps: { h: handler1 } }
    );

    rerender({ h: handler2 });

    // subscribe should only have been called once (on mount)
    expect(ctx.subscribe).toHaveBeenCalledTimes(1);

    // The stable handler now delegates to handler2
    const stableHandler = vi.mocked(ctx.subscribe).mock.calls[0][1];
    const msg = { type: 'ping' } as WsServerMessage;
    stableHandler(msg);

    expect(handler1).not.toHaveBeenCalled();
    expect(handler2).toHaveBeenCalledWith(msg);
  });

  it('re-subscribes when the room changes', () => {
    const handler = vi.fn();
    const ROOM_B: WsRoomId = 'ticket:other-456';

    const { rerender } = renderHook(
      ({ room }: { room: WsRoomId }) => {
        useWsSubscription(room, handler);
      },
      { wrapper: wrapper(ctx), initialProps: { room: ROOM } }
    );

    rerender({ room: ROOM_B });

    // unsubscribe from old room, subscribe to new room
    expect(ctx.unsubscribe).toHaveBeenCalledWith(ROOM, expect.any(Function));
    expect(ctx.subscribe).toHaveBeenCalledWith(ROOM_B, expect.any(Function));
  });

  it('throws when used outside WsProvider', () => {
    // Render without a provider -- context will be undefined
    expect(() =>
      renderHook(() => {
        useWsSubscription(ROOM, vi.fn());
      })
    ).toThrow('useWs must be used within WsProvider');
  });
});
