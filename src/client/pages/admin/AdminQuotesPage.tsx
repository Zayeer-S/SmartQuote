import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useListTickets } from '../../hooks/tickets/useListTicket';
import { useListQuotes } from '../../hooks/quotes/useListQuote';
import { CLIENT_ROUTES } from '../../constants/client.routes';
import { getStatusBadgeClass } from '../../lib/utils/badge-utils';
import { QUOTE_APPROVAL_STATUSES, TICKET_STATUSES } from '../../../shared/constants/lookup-values';
import type { QuoteApprovalStatus } from '../../../shared/constants/lookup-values';
import type { TicketDetailResponse } from '../../../shared/contracts/ticket-contracts';
import type { QuoteResponse } from '../../../shared/contracts/quote-contracts';
import './AdminQuotesPage.css';

type ApprovalFilter = QuoteApprovalStatus | '';

const APPROVAL_OPTIONS = Object.values(QUOTE_APPROVAL_STATUSES);

const TICKETS_WITH_ACTIVE_QUOTES = [
  TICKET_STATUSES.ASSIGNED,
  TICKET_STATUSES.IN_PROGRESS,
  TICKET_STATUSES.OPEN,
  TICKET_STATUSES.RESOLVED,
];

interface TicketQuoteRowProps {
  ticket: TicketDetailResponse;
}

const TicketQuoteRow: React.FC<TicketQuoteRowProps> = ({ ticket }) => {
  const { execute, data, loading, error } = useListQuotes();

  useEffect(() => {
    void execute(ticket.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticket.id]);

  const latestQuote: QuoteResponse | null =
    data && data.quotes.length > 0
      ? data.quotes.reduce((a, b) => (a.version > b.version ? a : b))
      : null;

  if (loading) {
    return (
      <li className="quote-row quote-row--loading" data-testid={`quote-row-loading-${ticket.id}`}>
        <span className="loading-text">Loading quote for {ticket.title}...</span>
      </li>
    );
  }

  if (error || !latestQuote) return null;

  const formattedCost = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(latestQuote.estimatedCost);

  return (
    <li className="quote-row" data-testid={`quote-row-${ticket.id}`}>
      <div className="quote-row-main">
        <Link
          className="quote-row-title"
          to={CLIENT_ROUTES.ADMIN.QUOTE(ticket.id, latestQuote.id)}
          data-testid={`quote-row-link-${ticket.id}`}
        >
          {ticket.title}
        </Link>
        <span className="quote-row-org" data-testid={`quote-row-org-${ticket.id}`}>
          {ticket.organizationName}
        </span>
      </div>

      <div className="quote-row-meta">
        <span className="badge badge-neutral" data-testid={`quote-row-version-${ticket.id}`}>
          v{latestQuote.version}
        </span>
        <span className="quote-row-cost" data-testid={`quote-row-cost-${ticket.id}`}>
          {formattedCost}
        </span>
        <span className="quote-row-hours" data-testid={`quote-row-hours-${ticket.id}`}>
          {latestQuote.estimatedHoursMinimum}–{latestQuote.estimatedHoursMaximum} hrs
        </span>
        <span
          className={getStatusBadgeClass(ticket.ticketStatusName)}
          data-testid={`quote-row-status-${ticket.id}`}
        >
          {ticket.ticketStatusName}
        </span>
      </div>

      <div className="quote-row-actions">
        <Link
          className="btn btn-ghost btn-sm"
          to={CLIENT_ROUTES.ADMIN.TICKET(ticket.id)}
          data-testid={`quote-row-ticket-link-${ticket.id}`}
        >
          View Ticket
        </Link>
        <Link
          className="btn btn-secondary btn-sm"
          to={CLIENT_ROUTES.ADMIN.QUOTE(ticket.id, latestQuote.id)}
          data-testid={`quote-row-quote-link-${ticket.id}`}
        >
          Manage Quote
        </Link>
      </div>
    </li>
  );
};

const AdminQuotesPage: React.FC = () => {
  const { execute, data, loading, error } = useListTickets();
  const [approvalFilter, setApprovalFilter] = useState<ApprovalFilter>('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    void execute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tickets = data?.tickets ?? [];

  const filteredTickets = tickets.filter((t) => {
    if (
      !TICKETS_WITH_ACTIVE_QUOTES.includes(
        t.ticketStatusName as (typeof TICKETS_WITH_ACTIVE_QUOTES)[number]
      )
    )
      return false;
    if (search.trim()) {
      const term = search.trim().toLowerCase();
      if (!t.title.toLowerCase().includes(term) && !t.organizationName.toLowerCase().includes(term))
        return false;
    }
    return true;
  });

  if (loading) {
    return (
      <p className="loading-text" data-testid="admin-quotes-loading">
        Loading quotes...
      </p>
    );
  }

  if (error) {
    return (
      <p className="feedback-error" role="alert" data-testid="admin-quotes-error">
        {error}
      </p>
    );
  }

  return (
    <div className="admin-page" data-testid="admin-quotes-page">
      <div className="page-header">
        <h1 className="page-title">Quote Management</h1>
      </div>

      <div
        className="quote-filters"
        role="search"
        aria-label="Filter quotes"
        data-testid="quote-filters"
      >
        <input
          className="field-input quote-filters-search"
          type="search"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
          }}
          placeholder="Search by ticket title or organisation..."
          aria-label="Search quotes"
          data-testid="quote-search"
        />

        <select
          className="field-select quote-filters-status"
          value={approvalFilter}
          onChange={(e) => {
            setApprovalFilter(e.target.value as ApprovalFilter);
          }}
          aria-label="Filter by approval status"
          data-testid="quote-approval-filter"
        >
          <option value="">All approval statuses</option>
          {APPROVAL_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>

        {(search || approvalFilter) && (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => {
              setSearch('');
              setApprovalFilter('');
            }}
            data-testid="quote-filter-clear"
          >
            Clear filters
          </button>
        )}
      </div>

      {filteredTickets.length === 0 ? (
        <div className="empty-state" data-testid="admin-quotes-empty">
          <p className="empty-state-message">No tickets with quotes found.</p>
        </div>
      ) : (
        <ul className="quote-list" role="list" data-testid="admin-quotes-list">
          {filteredTickets.map((ticket) => (
            <TicketQuoteRow key={ticket.id} ticket={ticket} />
          ))}
        </ul>
      )}
    </div>
  );
};

export default AdminQuotesPage;
