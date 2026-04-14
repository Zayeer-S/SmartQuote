import { eventBus } from '../lib/event-bus';
import { ConnectionManager } from './connection-manager';
import { buildWsMessage } from './event.types';

export function registerCommentHandlers(connectionManager: ConnectionManager): void {
  eventBus.on('comment:created', (payload) => {
    const message = JSON.stringify(buildWsMessage('comment:created', payload));

    connectionManager.broadcastToRoom(`ticket:${payload.ticketId}`, message);
  });
}
