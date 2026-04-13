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

// TODO: STUBBED
export interface AppEventMap {
  'ticket:created': TicketCreatedPayload;
  'ticket:assigned': TicketCreatedPayload; // TODO: STUBBED
  'comment:created': TicketCreatedPayload; // TODO: STUBBED
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
