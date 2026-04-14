export type WsRoomId =
  | `ticket:${string}`
  | `org:${string}`
  | 'admin:dashboard'
  | `user:${string}`
  | 'sla:monitor';

/** Sent immediately after the WS connection opens */
export interface WsAuthMessage {
  type: 'auth';
  token: string;
}

/** Subscribe to one or more rooms after auth is confirmed */
export interface WsSubscribeMessage {
  type: 'subscribe';
  rooms: WsRoomId[];
}

/** Unsubscribe from rooms (e.g. when navigating away) */
export interface WsUnsubscribeMessage {
  type: 'unsubscribe';
  rooms: WsRoomId[];
}

export type WsClientMessage = WsAuthMessage | WsSubscribeMessage | WsUnsubscribeMessage;

// Server => Client messages

export interface WsAuthAck {
  type: 'auth:ack';
  userId: string;
}

export interface WsAuthError {
  type: 'auth:error';
  message: string;
}

export interface WsSubscribeAck {
  type: 'subscribe:ack';
  rooms: WsRoomId[];
}

export interface WsErrorMessage {
  type: 'error';
  message: string;
}

/** Heartbeat */
export interface WsPingMessage {
  type: 'ping';
}

export interface CommentCreatedPayload {
  ticketId: string;
  commentId: string;
  authorUserId: string;
  authorDisplayName: string;
  commentText: string;
  commentType: string;
  createdAt: string;
}

export interface WsEventMessage<T extends string = string, D = unknown> {
  type: T;
  data: D;
  sentAt: string;
}

export type WsServerMessage =
  | WsAuthAck
  | WsAuthError
  | WsSubscribeAck
  | WsErrorMessage
  | WsPingMessage
  | WsEventMessage;
