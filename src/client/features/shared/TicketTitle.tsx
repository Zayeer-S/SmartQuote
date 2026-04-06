import React, { useEffect } from 'react';
import {
  getPriorityBadgeClass,
  getQuoteApprovalBadgeClass,
  getSlaBadgeClass,
  getStatusBadgeClass,
} from '../../lib/utils/badge-utils';
import './TicketTitle.css';
import { useGetTicket } from '../../hooks/tickets/useGetTicket';

export interface TicketTitleProps {
  ticketId: string;
}

const QUOTE_STATUS_LABEL: Record<string, string> = {
  Pending: 'Quote Approval Pending',
  Approved: 'Quote Approved',
  'Rejected By Manager': 'Quote Rejected',
  'Rejected By Customer': 'Quote Rejected',
  Revised: 'Quote Revised',
};

const TicketTitle: React.FC<TicketTitleProps> = ({ ticketId }) => {
  const ticket = useGetTicket();

  useEffect(() => {
    void ticket.execute(ticketId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId]);

  const isLoading = ticket.loading;
  const error = ticket.error;

  if (isLoading) {
    return (
      <p className="loading-text" data-testid="ticket-title-loading">
        Loading ticket...
      </p>
    );
  }

  if (error) {
    return (
      <p className="feedback-error" role="alert" data-testid="ticket-title-error">
        {error}
      </p>
    );
  }

  if (!ticket.data) {
    return (
      <p className="loading-text" data-testid="ticket-title-not-found">
        Ticket title not found
      </p>
    );
  }

  const t = ticket.data;

  const quoteLabel =
    t.quoteStatus !== null ? (QUOTE_STATUS_LABEL[t.quoteStatus] ?? t.quoteStatus) : 'Quote Needed';

  return (
    <div className="ticket-detail-header">
      <h1 className="ticket-detail-title" data-testid="ticket-title">
        {t.title}
      </h1>
      <div className="ticket-detail-badges">
        <span className={getStatusBadgeClass(t.ticketStatus)} data-testid="ticket-status">
          {t.ticketStatus}
        </span>
        <span className={getPriorityBadgeClass(t.ticketPriority)} data-testid="ticket-priority">
          {t.ticketPriority}
        </span>
        <span
          className={getQuoteApprovalBadgeClass(t.quoteStatus)}
          data-testid="ticket-quote-status"
        >
          {quoteLabel}
        </span>
        {t.slaStatus !== null && (
          <span
            className={getSlaBadgeClass(t.slaStatus.deadlineBreached)}
            data-testid="ticket-sla-badge-header"
            title={t.slaStatus.policyName}
          >
            {t.slaStatus.deadlineBreached ? 'SLA Breached' : 'SLA OK'}
          </span>
        )}
      </div>
    </div>
  );
};

export default TicketTitle;
