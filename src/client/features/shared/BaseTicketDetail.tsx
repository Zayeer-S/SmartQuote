import React, { useEffect } from 'react';
import { useGetTicket } from '../../hooks/tickets/useGetTicket';
import { useListQuotes } from '../../hooks/quotes/useListQuote';
import { getCurrentLocalDateString } from '../../lib/utils/format-timestamps';
import {
  getPriorityBadgeClass,
  getSlaBadgeClass,
  getStatusBadgeClass,
} from '../../lib/utils/badge-utils';
import AttachmentList from './AttachmentList';
import './BaseTicketDetail.css';

export interface TicketDetailProps {
  ticketId: string;
}

const BaseTicketDetail: React.FC<TicketDetailProps> = ({ ticketId }) => {
  const ticket = useGetTicket();
  const quotes = useListQuotes();

  useEffect(() => {
    void ticket.execute(ticketId);
    void quotes.execute(ticketId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId]);

  const isLoading = ticket.loading || quotes.loading;
  const error = ticket.error ?? quotes.error;

  if (isLoading) {
    return (
      <p className="loading-text" data-testid="ticket-detail-loading">
        Loading ticket...
      </p>
    );
  }

  if (error) {
    return (
      <p className="feedback-error" role="alert" data-testid="ticket-detail-error">
        {error}
      </p>
    );
  }

  if (!ticket.data) {
    return (
      <p className="loading-text" data-testid="ticket-detail-not-found">
        Ticket not found.
      </p>
    );
  }

  const t = ticket.data;

  const formattedDeadline = getCurrentLocalDateString(t.deadline);
  const formattedCreated = getCurrentLocalDateString(t.createdAt);

  return (
    <div className="ticket-detail" data-testid="ticket-detail">
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

      <section
        className="card card-padded ticket-detail-section"
        aria-labelledby="ticket-info-heading"
      >
        <h2 className="ticket-detail-section-heading" id="ticket-info-heading">
          Details
        </h2>

        <p className="ticket-ticket-detail-description" data-testid="ticket-description">
          {t.description}
        </p>

        <dl className="ticket-detail-dl">
          <div className="ticket-detail-dl-row">
            <dt>Type</dt>
            <dd data-testid="ticket-type">{t.ticketType}</dd>
          </div>
          <div className="ticket-detail-dl-row">
            <dt>Severity</dt>
            <dd data-testid="ticket-severity">{t.ticketSeverity}</dd>
          </div>
          <div className="ticket-detail-dl-row">
            <dt>Business Impact</dt>
            <dd data-testid="ticket-business-impact">{t.businessImpact}</dd>
          </div>
          <div className="ticket-detail-dl-row">
            <dt>Users Impacted</dt>
            <dd data-testid="ticket-users-impacted">{t.usersImpacted}</dd>
          </div>
          <div>
            <dt>Organisation</dt>
            <dd data-testid="ticket-organisation">{t.organizationName}</dd>
          </div>
          <div className="ticket-detail-dl-row">
            <dt>Timeline</dt>
            <dd className="ticket-detail-timeline" data-testid="ticket-created">
              {formattedCreated}
            </dd>
            {' - '}
            <dd className="ticket-detail-timeline" data-testid="ticket-deadline">
              {formattedDeadline}
            </dd>
          </div>
          <div className="ticket-detail-section-title" id="attachments-section-heading">
            Attachments
            <AttachmentList ticketId={ticketId} attachments={t.attachments} />
          </div>
        </dl>
      </section>
    </div>
  );
};

export default BaseTicketDetail;
