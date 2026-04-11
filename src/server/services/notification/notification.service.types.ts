/**
 * Data required to send ticket received notification
 */
export interface NotifyTicketReceivedData {
  ticketId: string;
  ticketTitle: string;
  ticketDescription: string;
  ticketType: string;
  severity: string;
  createdAt: Date;
  userId: string;
  userEmail: string;
  userFirstName: string;
}

/**
 * Data required to send quote generated notification
 */
export interface NotifyQuoteGeneratedData {
  quoteId: string;
  ticketId: string;
  ticketTitle: string;
  estimatedHoursMin: number;
  estimatedHoursMax: number;
  estimatedCost: number;
  suggestedPriority: string;
  effortLevel: string;
  userId: string;
  userEmail: string;
  userFirstName: string;
}

/**
 * Data required to send ticket status updated notification
 */
export interface NotifyTicketStatusUpdatedData {
  ticketId: string;
  ticketTitle: string;
  oldStatus: string;
  newStatus: string;
  updatedBy: string;
  updatedAt: Date;
  comment?: string;
  userId: string;
  userEmail: string;
  userFirstName: string;
}

/**
 * Data required to send ticket resolved notification
 */
export interface NotifyTicketResolvedData {
  ticketId: string;
  ticketTitle: string;
  resolvedBy: string;
  resolvedAt: Date;
  resolutionComment?: string;
  userId: string;
  userEmail: string;
  userFirstName: string;
}

/**
 * Data required to send ticket assigned notification
 */
export interface NotifyTicketAssignedData {
  ticketId: string;
  ticketTitle: string;
  ticketDescription: string;
  ticketType: string;
  severity: string;
  priority: string;
  customerName: string;
  assignedBy: string;
  assignedAt: Date;
  deadline?: Date;
  assigneeUserId: string;
  assigneeEmail: string;
  assigneeFirstName: string;
}

/**
 * Result of a notification attempt
 */
export interface NotificationResult {
  success: boolean;
  messageId?: string | null;
  error?: string;
  skipped?: boolean;
  skipReason?: string;
}
