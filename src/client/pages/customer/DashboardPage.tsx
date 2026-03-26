import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useListTickets } from '../../hooks/tickets/useListTicket.js';
import { useAuth } from '../../hooks/contexts/useAuth.js';
import { CLIENT_ROUTES } from '../../constants/client.routes.js';
import StatsOverview from '../../features/dashboard/StatsOverview.js';
import TicketStatusChart from '../../features/dashboard/TicketStatusChart.js';
import CustomerTicketCard from '../../features/tickets/CustomerTicketCard.js';
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
const IconArrow = () => (
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
const IconTicketEmpty = () => (
  <svg
    width="24"
    height="24"
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
const IconTicketStat = () => (
  <svg
    width="20"
    height="20"
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
const IconActive = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);
const IconQuoteStat = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="8" y1="13" x2="16" y2="13" />
    <line x1="8" y1="17" x2="13" y2="17" />
  </svg>
);
const IconPending = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
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

  /* ── Derived stats from real ticket data ── */
  const totalTickets = allTickets.length;
  const activeTickets = allTickets.filter(
    (t) => t.status && !['closed', 'resolved', 'completed'].includes(String(t.status).toLowerCase())
  ).length;

  return (
    <div className="dashboard-page" data-testid="dashboard-page">
      {/* ── Header ── */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-heading">Welcome back{firstName ? `, ${firstName}` : ''}</h1>
          <p className="dashboard-subheading">Overview of your support tickets and quotes</p>
        </div>
        <Link
          to={CLIENT_ROUTES.CUSTOMER.NEW_TICKET}
          className="dashboard-cta-btn"
          data-testid="dashboard-new-ticket"
        >
          <IconPlus /> New Ticket
        </Link>
      </div>

      {/* ── Quick stat cards (always visible, derived from data) ── */}
      <div className="dashboard-stat-grid">
        <div className="dashboard-stat-card dashboard-stat-purple">
          <div className="dashboard-stat-icon-wrap">
            <IconTicketStat />
          </div>
          <div className="dashboard-stat-body">
            <div className="dashboard-stat-value">{loading ? '—' : totalTickets}</div>
            <div className="dashboard-stat-label">Total Tickets</div>
          </div>
        </div>

        <div className="dashboard-stat-card dashboard-stat-amber">
          <div className="dashboard-stat-icon-wrap">
            <IconActive />
          </div>
          <div className="dashboard-stat-body">
            <div className="dashboard-stat-value">{loading ? '—' : activeTickets}</div>
            <div className="dashboard-stat-label">Active Tickets</div>
          </div>
        </div>

        <div className="dashboard-stat-card dashboard-stat-navy">
          <div className="dashboard-stat-icon-wrap">
            <IconQuoteStat />
          </div>
          <div className="dashboard-stat-body">
            <div className="dashboard-stat-value">
              <Link to={CLIENT_ROUTES.CUSTOMER.QUOTES} className="dashboard-stat-link">
                View
              </Link>
            </div>
            <div className="dashboard-stat-label">My Quotes</div>
          </div>
        </div>

        <div className="dashboard-stat-card dashboard-stat-magenta">
          <div className="dashboard-stat-icon-wrap">
            <IconPending />
          </div>
          <div className="dashboard-stat-body">
            <div className="dashboard-stat-value">
              {loading
                ? '—'
                : allTickets.filter((t) => String(t.status ?? '').toLowerCase() === 'pending')
                    .length}
            </div>
            <div className="dashboard-stat-label">Pending</div>
          </div>
        </div>
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

      {/* ── Chart + Stats overview ── */}
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
              View all <IconArrow />
            </Link>
          </div>

          {recentTickets.length === 0 ? (
            <div className="empty-state" data-testid="dashboard-no-tickets">
              <div className="empty-state-icon-wrap">
                <IconTicketEmpty />
              </div>
              <p className="empty-state-title">No tickets yet</p>
              <p className="empty-state-message">Submit your first ticket to get started.</p>
              <Link className="dashboard-cta-btn" to={CLIENT_ROUTES.CUSTOMER.NEW_TICKET}>
                <IconPlus /> Submit a ticket
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
