import React from 'react';
import { UseGetTicketReturn } from '../../hooks/tickets/useGetTicket';
import { getDate } from '../../lib/utils/formatters';
import AttachmentList from './AttachmentList';
import './TicketDetailCard.css';

export interface TicketDetailProps {
  ticketId: string;
  ticket: UseGetTicketReturn;
}

const TicketDetailCard: React.FC<TicketDetailProps> = ({ ticketId, ticket }) => {
  const isLoading = ticket.loading;
  const error = ticket.error;

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

  const formattedDeadline = getDate(t.deadline);
  const formattedCreated = getDate(t.createdAt);

  return (
    <div className="ticket-detail" data-testid="ticket-detail">
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

export default TicketDetailCard;
