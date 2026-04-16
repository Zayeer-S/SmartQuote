import { useContext } from 'react';
import { WsContext, WsContextValue } from '../../context/ws.context.types.js';

export function useWs(): WsContextValue {
  const ctx = useContext(WsContext);
  if (!ctx) throw new Error('useWs must be used within WsProvider');
  return ctx;
}
