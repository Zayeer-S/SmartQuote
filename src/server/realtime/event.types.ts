import {
  CommentCreatedPayload,
  QuoteEventPayload,
} from '../../shared/contracts/realtime-contracts';

// STUB: PAYLOADS SHOULD BE IN CONTRACTS
export interface TicketCreatedPayload {
  ticketId: string;
  orgId: string;
  title: string;
  creatorUserId: string;
  ticketType: string;
  ticketSeverity: string;
  ticketPriority: string;
  createdAt: string;
}

export interface AppEventMap {
  'ticket:created': TicketCreatedPayload;
  'ticket:assigned': TicketCreatedPayload; // TODO: STUBBED
  'comment:created': CommentCreatedPayload;
  'quote:created': QuoteEventPayload;
  'quote:updated': QuoteEventPayload;
  'quote:approved-by-agent': QuoteEventPayload;
  'quote:approved-by-manager': QuoteEventPayload;
  'quote:approved-by-admin': QuoteEventPayload;
  /** Also means ticket is resolved */
  'quote:approved-by-customer': QuoteEventPayload;
  'quote:rejected-by-manager': QuoteEventPayload;
  'sla:breach-imminent': TicketCreatedPayload; // TODO: STUBBED
  'sla:breached': TicketCreatedPayload; // TODO: STUBBED
}

export type AppEvent = keyof AppEventMap;

/**
 * Every message pushed to a client follows this envelope.
 * The frontend discriminates on `type` to handle the payload.
 */
export interface WsMessage<K extends AppEvent = AppEvent> {
  type: K;
  data: AppEventMap[K];
  /** ISO 8601 */
  sentAt: string;
}

export function buildWsMessage<K extends AppEvent>(type: K, data: AppEventMap[K]): WsMessage<K> {
  return { type, data, sentAt: new Date().toISOString() };
}
