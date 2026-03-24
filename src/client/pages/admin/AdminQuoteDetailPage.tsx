import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CLIENT_ROUTES } from '../../constants/client.routes';
import { useListQuotes } from '../../hooks/quotes/useListQuote';
import { useGetTicket } from '../../hooks/tickets/useGetTicket';
import { getStatusBadgeClass } from '../../lib/utils/badge-utils';
import AdminQuotePanel from '../../features/tickets/AdminQuotePanel';
import CommentThread from '../../features/tickets/CommentThread';
import './AdminQuoteDetailPage.css';

const AdminQuoteDetailPage: React.FC = () => {
  const { ticketId, quoteId } = useParams<{ ticketId: string; quoteId: string }>();

  const ticket = useGetTicket();
  const quotes = useListQuotes();

  const loadData = (): void => {
    if (!ticketId) return;
    void ticket.execute(ticketId);
    void quotes.execute(ticketId);
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId]);

  if (!ticketId || !quoteId) {
    return (
      <p className="feedback-error" role="alert" data-testid="admin-quote-detail-page-no-id">
        Missing ticket or quote ID.
      </p>
    );
  }

  const isLoading = ticket.loading || quotes.loading;
  const error = ticket.error ?? quotes.error;

  if (isLoading) {
    return (
      <p className="loading-text" data-testid="admin-quote-detail-loading">
        Loading...
      </p>
    );
  }

  if (error) {
    return (
      <p className="feedback-error" role="alert" data-testid="admin-quote-detail-error">
        {error}
      </p>
    );
  }

  if (!ticket.data) {
    return (
      <p className="loading-text" data-testid="admin-quote-detail-no-ticket">
        Ticket not found.
      </p>
    );
  }

  const allQuotes = quotes.data?.quotes ?? [];

  return (
    <div className="admin-page" data-testid="admin-quote-detail-page">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link
          className="breadcrumb-link"
          to={CLIENT_ROUTES.ADMIN.QUOTES}
          data-testid="breadcrumb-quotes"
        >
          Quotes
        </Link>
        <span className="breadcrumb-sep" aria-hidden="true">
          /
        </span>
        <Link
          className="breadcrumb-link"
          to={CLIENT_ROUTES.ADMIN.TICKET(ticketId)}
          data-testid="breadcrumb-ticket"
        >
          {ticket.data.title}
        </Link>
        <span className="breadcrumb-sep" aria-hidden="true">
          /
        </span>
        <span className="breadcrumb-current" aria-current="page">
          Quote Detail
        </span>
      </nav>

      <header className="admin-quote-detail-header">
        <h1 className="admin-quote-detail-title">{ticket.data.title}</h1>
        <div className="admin-quote-detail-meta">
          <span
            className={getStatusBadgeClass(ticket.data.ticketStatusName)}
            data-testid="quote-detail-ticket-status"
          >
            {ticket.data.ticketStatusName}
          </span>
          <span className="admin-quote-detail-org" data-testid="quote-detail-ticket-org">
            {ticket.data.organizationName}
          </span>
        </div>
      </header>

      <AdminQuotePanel ticketId={ticketId} quotes={allQuotes} onQuoteMutated={loadData} />

      <CommentThread ticketId={ticketId} />
    </div>
  );
};

export default AdminQuoteDetailPage;
