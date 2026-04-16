import { eventBus } from '../lib/event-bus';
import { ConnectionManager } from './connection-manager';
import { buildWsMessage } from './event.types';

export function registerCommentHandlers(connectionManager: ConnectionManager): void {
  eventBus.on('comment:created', (payload) => {
    const message = JSON.stringify(buildWsMessage('comment:created', payload));
    connectionManager.broadcastToRoom(`ticket:${payload.ticketId}`, message);
  });
}

export function registerQuoteHandlers(connectionManager: ConnectionManager): void {
  const quoteEvents = [
    'quote:created',
    'quote:updated',
    'quote:approved-by-agent',
    'quote:approved-by-manager',
    'quote:approved-by-admin',
    'quote:approved-by-customer',
    'quote:rejected-by-manager',
  ] as const;

  for (const event of quoteEvents) {
    eventBus.on(event, (payload) => {
      const message = JSON.stringify(buildWsMessage(event, payload));
      connectionManager.broadcastToRoom(`ticket:${payload.ticketId}`, message);
    });
  }
}

export function registerTicketHandlers(connectionManager: ConnectionManager): void {
  eventBus.on('ticket:created', (payload) => {
    const message = JSON.stringify(buildWsMessage('ticket:created', payload));
    connectionManager.broadcastToRoom('admin:dashboard', message);
    if (payload.organizationId) {
      connectionManager.broadcastToRoom(`org:${payload.organizationId}`, message);
    }
  });

  eventBus.on('ticket:assigned', (payload) => {
    const message = JSON.stringify(buildWsMessage('ticket:assigned', payload));
    connectionManager.broadcastToRoom(`ticket:${payload.ticketId}`, message);
    connectionManager.broadcastToRoom('admin:dashboard', message);
  });
}

export function registerSlaHandlers(connectionManager: ConnectionManager): void {
  const slaEvents = ['sla:breach-imminent', 'sla:breached'] as const;

  for (const event of slaEvents) {
    eventBus.on(event, (payload) => {
      const message = JSON.stringify(buildWsMessage(event, payload));
      connectionManager.broadcastToRoom('sla:monitor', message);
      connectionManager.broadcastToRoom(`ticket:${payload.ticketId}`, message);
    });
  }
}
