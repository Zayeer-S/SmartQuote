import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useListTickets } from '../../hooks/tickets/useListTicket';
import { useAuth } from '../../hooks/contexts/useAuth';
import { CLIENT_ROUTES } from '../../constants/client.routes';
import StatsOverview from '../../features/dashboard/StatsOverview';
import TicketStatusChart from '../../features/dashboard/TicketStatusChart';
import TicketCard from '../../features/tickets/CustomerTicketCard';

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
    <div data-testid="dashboard-page">
      <h1>Welcome back{firstName ? `, ${firstName}` : ''}</h1>

      {loading && <p data-testid="dashboard-loading">Loading...</p>}

      {error && (
        <p role="alert" data-testid="dashboard-error">
          {error}
        </p>
      )}

      {!loading && !error && (
        <div data-testid="dashboard-overview">
          <TicketStatusChart tickets={allTickets} />
          <StatsOverview tickets={allTickets} />
        </div>
      )}

      {!loading && !error && (
        <section aria-labelledby="recent-tickets-heading">
          <div>
            <h2 id="recent-tickets-heading">Recent Tickets</h2>
            <Link to={CLIENT_ROUTES.CUSTOMER.TICKETS} data-testid="view-all-tickets-link">
              View all
            </Link>
          </div>

          {recentTickets.length === 0 ? (
            <div data-testid="dashboard-no-tickets">
              <p>You have not submitted any tickets yet.</p>
              <Link to={CLIENT_ROUTES.CUSTOMER.NEW_TICKET}>Submit your first ticket</Link>
            </div>
          ) : (
            <ul role="list" data-testid="recent-ticket-list">
              {recentTickets.map((ticket) => (
                <li key={ticket.id}>
                  <TicketCard ticket={ticket} />
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
