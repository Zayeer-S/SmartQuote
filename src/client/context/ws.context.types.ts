import { createContext } from 'react';
import { WsRoomId, WsServerMessage } from '../../shared/contracts/realtime-contracts';

export type WsMessageHandler = (msg: WsServerMessage) => void;

export type WsStatus = 'connecting' | 'authenticating' | 'ready' | 'closed' | 'error';

export interface WsContextValue {
  status: WsStatus;
  subscribe: (room: WsRoomId, handler: WsMessageHandler) => void;
  unsubscribe: (room: WsRoomId, handler: WsMessageHandler) => void;
}

export interface WsProviderProps {
  children: React.ReactNode;
}

export const WsContext = createContext<WsContextValue | undefined>(undefined);
