import React, { type ReactNode } from 'react';
import type { TicketSummaryResponse } from '../../../shared/contracts/ticket-contracts.js';
import './BaseTicketList.css';

interface BaseTicketListProps {
  tickets: TicketSummaryResponse[];
  renderItem: (ticket: TicketSummaryResponse) => ReactNode;
  loading: boolean;
  error: string | null;
  emptyMessage: string;
  /** Prefix applied to all data-testid attributes, e.g. "admin-tickets" or "tickets" */
  testIdPrefix: string;
}

function BaseTicketList({
  tickets,
  renderItem,
  loading,
  error,
  emptyMessage,
  testIdPrefix,
}: BaseTicketListProps): React.ReactElement | null {
  if (loading) {
    return (
      <p className="loading-text" data-testid={`${testIdPrefix}-loading`}>
        Loading tickets...
      </p>
    );
  }

  if (error) {
    return (
      <p className="feedback-error" role="alert" data-testid={`${testIdPrefix}-error`}>
        {error}
      </p>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="empty-state" data-testid={`${testIdPrefix}-empty`}>
        <p className="empty-state-message">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <ul className="base-ticket-list" role="list" data-testid={`${testIdPrefix}-list`}>
      {tickets.map((ticket) => (
        <li key={ticket.id}>{renderItem(ticket)}</li>
      ))}
    </ul>
  );
}

export default BaseTicketList;
