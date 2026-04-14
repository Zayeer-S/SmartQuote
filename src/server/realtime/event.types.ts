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

export interface CommentCreatedPayload {
  ticketId: string;
  commentId: string;
  orgId: string;
  authorUserId: string;
  authorDisplayName: string;
  commentText: string;
  commentType: string;
  createdAt: string;
}

export interface AppEventMap {
  'ticket:created': TicketCreatedPayload;
  'ticket:assigned': TicketCreatedPayload; // TODO: STUBBED
  'comment:created': CommentCreatedPayload;
  'quote:created': TicketCreatedPayload; // TODO: STUBBED
  'quote:updated': TicketCreatedPayload; // TODO: STUBBED
  'quote:approved-by-agent': TicketCreatedPayload; // TODO: STUBBED
  'quote:approved-by-manager': TicketCreatedPayload; // TODO: STUBBED
  /** Also means ticket is resolved */
  'quote:approved-by-customer': TicketCreatedPayload; // TODO: STUBBED
  'quote:rejected-by-manager': TicketCreatedPayload; // TODO: STUBBED
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
