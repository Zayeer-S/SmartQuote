import React, { useEffect } from 'react';
import { useGetTicket } from '../../hooks/tickets/useGetTicket';
import { useListQuotes } from '../../hooks/quotes/useListQuote';
import { getStatusBadgeClass, getPriorityBadgeClass } from '../../lib/utils/badge-utils';
import QuotePanel from './QuotePanel';
import TicketTimeline from './TicketTimeline';
import './CustomerTicketDetail.css';

interface CustomerTicketDetailProps {
  ticketId: string;
}

const CustomerTicketDetail: React.FC<CustomerTicketDetailProps> = ({ ticketId }) => {
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

  const formattedDeadline = new Date(t.deadline).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const formattedCreated = new Date(t.createdAt).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const latestQuote =
    quotes.data && quotes.data.quotes.length > 0
      ? quotes.data.quotes.reduce((a, b) => (a.version > b.version ? a : b))
      : null;

  return (
    <div className="ticket-detail" data-testid="ticket-detail">
      <div className="ticket-detail-header">
        <div>
          <h1 className="ticket-detail-title" data-testid="ticket-title">
            {t.title}
          </h1>
          <div className="ticket-detail-badges">
            <span className={getStatusBadgeClass(t.ticketStatusName)} data-testid="ticket-status">
              {t.ticketStatusName}
            </span>
            <span
              className={getPriorityBadgeClass(t.ticketPriorityName)}
              data-testid="ticket-priority"
            >
              {t.ticketPriorityName}
            </span>
          </div>
        </div>
      </div>

      <section
        className="card card-padded ticket-detail-section"
        aria-labelledby="ticket-info-heading"
      >
        <h2 className="ticket-detail-section-title" id="ticket-info-heading">
          Details
        </h2>

        <p className="ticket-detail-description" data-testid="ticket-description">
          {t.description}
        </p>

        <dl className="ticket-detail-dl">
          <div>
            <dt>Type</dt>
            <dd data-testid="ticket-type">{t.ticketTypeName}</dd>
          </div>
          <div>
            <dt>Severity</dt>
            <dd data-testid="ticket-severity">{t.ticketSeverityName}</dd>
          </div>
          <div>
            <dt>Business Impact</dt>
            <dd data-testid="ticket-business-impact">{t.businessImpactName}</dd>
          </div>
          <div>
            <dt>Users Impacted</dt>
            <dd data-testid="ticket-users-impacted">{t.usersImpacted}</dd>
          </div>
          <div>
            <dt>Deadline</dt>
            <dd data-testid="ticket-deadline">{formattedDeadline}</dd>
          </div>
          <div>
            <dt>Organisation</dt>
            <dd data-testid="ticket-organisation">{t.organizationName}</dd>
          </div>
          <div>
            <dt>Submitted</dt>
            <dd data-testid="ticket-created">{formattedCreated}</dd>
          </div>
        </dl>
      </section>

      <section className="ticket-detail-section" aria-labelledby="quote-section-heading">
        <h2 className="ticket-detail-section-title" id="quote-section-heading">
          Quote
        </h2>
        {latestQuote ? (
          <QuotePanel ticketId={ticketId} quote={latestQuote} />
        ) : (
          <p className="empty-state-message" data-testid="no-quote">
            No quote has been generated yet.
          </p>
        )}
      </section>

      <TicketTimeline ticketId={ticketId} />
    </div>
  );
};

export default CustomerTicketDetail;
