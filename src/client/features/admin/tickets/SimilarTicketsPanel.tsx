import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CLIENT_ROUTES } from '../../../constants/client.routes.js';
import { getPriorityBadgeClass, getStatusBadgeClass } from '../../../lib/utils/badge-utils.js';
import type { SimilarTicketResponse } from '../../../../shared/contracts/ticket-contracts.js';
import './SimilarTicketsPanel.css';
import { useGetSimilarTickets } from '../../../hooks/tickets/useGetSimilarTicket.js';

interface SimilarTicketsPanelProps {
  ticketId: string;
}

interface SimilarTicketRowProps {
  result: SimilarTicketResponse;
}

const SimilarTicketRow: React.FC<SimilarTicketRowProps> = ({ result }) => {
  const { ticket, quote, similarityScore } = result;
  const scorePercent = (similarityScore * 100).toFixed(1);

  return (
    <li className="similar-ticket-row" data-testid={`similar-ticket-${ticket.id}`}>
      <div className="similar-ticket-row-header">
        <Link
          to={CLIENT_ROUTES.ADMIN.TICKET(ticket.id)}
          className="similar-ticket-title"
          data-testid="similar-ticket-link"
        >
          {ticket.title}
        </Link>
        <span className="similar-ticket-score" data-testid="similar-ticket-score">
          {scorePercent}% match
        </span>
      </div>

      <div className="similar-ticket-badges">
        <span className={getPriorityBadgeClass(ticket.ticketPriority)}>
          {ticket.ticketPriority}
        </span>
        <span className={getStatusBadgeClass(ticket.ticketStatus)}>{ticket.ticketStatus}</span>
        <span className="badge badge-neutral">{ticket.ticketType}</span>
        <span className="badge badge-neutral">{ticket.ticketSeverity}</span>
        <span className="badge badge-neutral">{ticket.businessImpact}</span>
      </div>

      {quote !== null ? (
        <dl className="admin-detail-dl similar-ticket-quote">
          <div className="admin-detail-dl-row">
            <dt>Est. Cost</dt>
            <dd data-testid="similar-ticket-estimated-cost">
              &pound;{quote.estimatedCost.toFixed(2)}
            </dd>
          </div>
          <div className="admin-detail-dl-row">
            <dt>Final Cost</dt>
            <dd data-testid="similar-ticket-final-cost">
              {quote.finalCost !== null ? `\u00a3${quote.finalCost.toFixed(2)}` : <em>Pending</em>}
            </dd>
          </div>
          <div className="admin-detail-dl-row">
            <dt>Est. Hours</dt>
            <dd data-testid="similar-ticket-hours">
              {quote.estimatedHoursMinimum}&ndash;{quote.estimatedHoursMaximum}h
            </dd>
          </div>
          <div className="admin-detail-dl-row">
            <dt>Approval</dt>
            <dd data-testid="similar-ticket-approval">{quote.approvalStatus ?? 'None'}</dd>
          </div>
        </dl>
      ) : (
        <p className="similar-ticket-no-quote">No approved quote on record.</p>
      )}
    </li>
  );
};

const SimilarTicketsPanel: React.FC<SimilarTicketsPanelProps> = ({ ticketId }) => {
  const [expanded, setExpanded] = useState(false);
  const { data, loading, error, execute } = useGetSimilarTickets();

  const handleToggle = (): void => {
    if (!expanded && data === null) {
      void execute(ticketId);
    }
    setExpanded((prev) => !prev);
  };

  const results = data?.similarTickets ?? [];

  return (
    <section
      className="admin-detail-section similar-tickets-panel"
      aria-labelledby="similar-tickets-heading"
      data-testid="similar-tickets-panel"
    >
      <div className="similar-tickets-panel-header">
        <h2 className="admin-detail-section-heading" id="similar-tickets-heading">
          Similar Past Tickets
        </h2>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={handleToggle}
          aria-expanded={expanded}
          aria-controls="similar-tickets-list"
          data-testid="similar-tickets-toggle"
        >
          {expanded ? 'Hide' : 'Show Similar Tickets'}
        </button>
      </div>

      {expanded && (
        <div id="similar-tickets-list">
          {loading && (
            <p className="loading-text" data-testid="similar-tickets-loading">
              Finding similar tickets...
            </p>
          )}

          {error && (
            <p className="feedback-error" role="alert" data-testid="similar-tickets-error">
              {error}
            </p>
          )}

          {!loading && !error && results.length === 0 && (
            <p className="similar-tickets-empty" data-testid="similar-tickets-empty">
              No similar resolved tickets found yet.
            </p>
          )}

          {!loading && !error && results.length > 0 && (
            <ul className="similar-tickets-list" role="list" data-testid="similar-tickets-list">
              {results.map((result) => (
                <SimilarTicketRow key={result.ticket.id} result={result} />
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
};

export default SimilarTicketsPanel;
