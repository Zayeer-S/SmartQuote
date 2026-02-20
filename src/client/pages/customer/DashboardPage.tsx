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
      <h1 className="dashboard-heading">Welcome back{firstName ? `, ${firstName}` : ''}</h1>

      {loading && (
        <p className="loading-text" data-testid="dashboard-loading">
          Loading...
        </p>
      )}

      {error && (
        <p className="feedback-error" role="alert" data-testid="dashboard-error">
          {error}
        </p>
      )}

      {!loading && !error && (
        <div className="card dashboard-overview" data-testid="dashboard-overview">
          <TicketStatusChart tickets={allTickets} />
          {allTickets.length > 0 && (
            <div className="dashboard-overview-divider" aria-hidden="true" />
          )}
          <StatsOverview tickets={allTickets} />
        </div>
      )}

      {!loading && !error && (
        <section aria-labelledby="recent-tickets-heading">
          <div className="dashboard-section-header">
            <h2 className="dashboard-section-title" id="recent-tickets-heading">
              Recent Tickets
            </h2>
            <Link
              to={CLIENT_ROUTES.CUSTOMER.TICKETS}
              className="dashboard-view-all"
              data-testid="view-all-tickets-link"
            >
              View all
            </Link>
          </div>

          {recentTickets.length === 0 ? (
            <div className="empty-state" data-testid="dashboard-no-tickets">
              <p className="empty-state-message">You have not submitted any tickets yet.</p>
              <Link className="btn btn-primary btn-sm" to={CLIENT_ROUTES.CUSTOMER.NEW_TICKET}>
                Submit your first ticket
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
