import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useListTickets } from '../../hooks/tickets/useListTicket';
import { useAuth } from '../../hooks/contexts/useAuth';
import { CLIENT_ROUTES } from '../../constants/client.routes';
import StatsOverview from '../../features/dashboard/StatsOverview';
import TicketStatusChart from '../../features/dashboard/TicketStatusChart';
import CustomerTicketCard from '../../features/tickets/CustomerTicketCard';
import './DashboardPage.css';

const RECENT_TICKET_COUNT = 5;

/* ── SVG Icons ── */
const IconPlus = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const IconArrowRight = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const IconTicket = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M2 9a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v1a2 2 0 0 0 0 4v1a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-1a2 2 0 0 0 0-4V9z" />
  </svg>
);

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { execute, data, loading, error } = useListTickets();

  useEffect(() => {
    void execute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const allTickets = data?.tickets ?? [];
  const recentTickets = allTickets.slice(0, RECENT_TICKET_COUNT);
  const firstName = user?.firstName ?? '';

  return (
    <div className="dashboard-page" data-testid="dashboard-page">
      {/* ── Page header ── */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-heading">Welcome back{firstName ? `, ${firstName}` : ''}</h1>
          <p className="dashboard-subheading">Overview of your support tickets and quotes</p>
        </div>
        <Link
          to={CLIENT_ROUTES.CUSTOMER.NEW_TICKET}
          className="dashboard-new-ticket-btn"
          data-testid="dashboard-new-ticket"
        >
          <IconPlus />
          New Ticket
        </Link>
      </div>

      {/* ── Loading skeletons ── */}
      {loading && (
        <div className="dashboard-skeletons" data-testid="dashboard-loading">
          <div className="dashboard-skeleton" />
          <div className="dashboard-skeleton" />
          <div className="dashboard-skeleton" />
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <p className="feedback-error" role="alert" data-testid="dashboard-error">
          {error}
        </p>
      )}

      {/* ── Stats + Chart ── */}
      {!loading && !error && (
        <div className="card dashboard-overview" data-testid="dashboard-overview">
          <TicketStatusChart tickets={allTickets} />
          {allTickets.length > 0 && (
            <div className="dashboard-overview-divider" aria-hidden="true" />
          )}
          <StatsOverview tickets={allTickets} />
        </div>
      )}

      {/* ── Recent Tickets ── */}
      {!loading && !error && (
        <section className="dashboard-section" aria-labelledby="recent-tickets-heading">
          <div className="dashboard-section-header">
            <h2 className="dashboard-section-title" id="recent-tickets-heading">
              Recent Tickets
            </h2>
            <Link
              to={CLIENT_ROUTES.CUSTOMER.TICKETS}
              className="dashboard-view-all"
              data-testid="view-all-tickets-link"
            >
              View all <IconArrowRight />
            </Link>
          </div>

          {recentTickets.length === 0 ? (
            <div className="empty-state" data-testid="dashboard-no-tickets">
              <div className="empty-state-icon-wrap">
                <IconTicket />
              </div>
              <p className="empty-state-title">No tickets yet</p>
              <p className="empty-state-message">Submit your first ticket to get started.</p>
              <Link className="dashboard-new-ticket-btn" to={CLIENT_ROUTES.CUSTOMER.NEW_TICKET}>
                <IconPlus />
                Submit a ticket
              </Link>
            </div>
          ) : (
            <ul className="dashboard-recent-list" role="list" data-testid="recent-ticket-list">
              {recentTickets.map((ticket) => (
                <li key={ticket.id}>
                  <CustomerTicketCard ticket={ticket} />
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
};

export default DashboardPage;
