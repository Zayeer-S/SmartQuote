import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomerLayout from './CustomerLayout';
import { CLIENT_ROUTES } from '../../constants/client.routes';
import { useListTickets } from '../../hooks/tickets/useListTicket';
import type { TicketResponse } from '../../../shared/contracts/ticket-contracts';
import { LOOKUP_IDS } from '../../../shared/constants';
import { TicketIcon, ClockIcon, DollarIcon } from '../../components/icons/CustomerIcons';
import './CustomerPage.css';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ACTIVE_STATUS_IDS = new Set<number>([
  LOOKUP_IDS.TICKET_STATUS.OPEN,
  LOOKUP_IDS.TICKET_STATUS.ASSIGNED,
  LOOKUP_IDS.TICKET_STATUS.IN_PROGRESS,
]);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function filterTickets(tickets: TicketResponse[], query: string): TicketResponse[] {
  const q = query.trim().toLowerCase();
  if (!q) return tickets;
  return tickets.filter(
    (t) => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const CustomerPage: React.FC = () => {
  const navigate = useNavigate();
  const { data, loading, error, execute: fetchTickets } = useListTickets();
  const [query, setQuery] = useState('');

  useEffect(() => {
    void fetchTickets();
    // Cascading render if you add dependency
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tickets = useMemo<TicketResponse[]>(() => data?.tickets ?? [], [data]);

  const filteredTickets = useMemo(() => filterTickets(tickets, query), [tickets, query]);

  const activeCount = useMemo(
    () => tickets.filter((t) => ACTIVE_STATUS_IDS.has(t.ticketStatusId)).length,
    [tickets]
  );

  return (
    <CustomerLayout>
      <header className="topBar" data-testid="dashboard-header">
        <div>
          <h1 className="pageTitle">Dashboard</h1>
          <p className="pageSubtitle">Manage your support tickets and view quotes</p>
        </div>
      </header>

      <section className="statsGrid" aria-label="Ticket statistics" data-testid="stats-grid">
        <div className="statCard" data-testid="stat-card-total-tickets">
          <div className="statIcon blue" aria-hidden="true">
            <TicketIcon />
          </div>
          <div className="statValue" aria-label={`Total tickets: ${String(tickets.length)}`}>
            {loading ? '—' : tickets.length}
          </div>
          <div className="statLabel">Total Tickets</div>
        </div>

        <div className="statCard" data-testid="stat-card-active-tickets">
          <div className="statIcon amber" aria-hidden="true">
            <ClockIcon />
          </div>
          <div className="statValue" aria-label={`Active tickets: ${String(activeCount)}`}>
            {loading ? '—' : activeCount}
          </div>
          <div className="statLabel">Active Tickets</div>
        </div>

        <div className="statCard" data-testid="stat-card-total-quoted">
          <div className="statIcon green" aria-hidden="true">
            <DollarIcon />
          </div>
          <div className="statValue" aria-label="Total quoted: not yet available">
            —
          </div>
          <div className="statLabel">Total Quoted</div>
        </div>

        <div className="statCard" data-testid="stat-card-pending-quotes">
          <div className="statIcon orange" aria-hidden="true">
            <TicketIcon />
          </div>
          <div className="statValue" aria-label="Pending quotes: not yet available">
            —
          </div>
          <div className="statLabel">Pending Quotes</div>
        </div>
      </section>

      <section className="actionsRow" aria-label="Ticket actions" data-testid="actions-row">
        <div className="searchWrap" role="search">
          <span className="searchIcon" aria-hidden="true" />
          <input
            id="ticket-search"
            className="searchInput"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
            }}
            placeholder="Search tickets..."
            aria-label="Search tickets"
            data-testid="ticket-search-input"
          />
        </div>

        <button
          className="primaryBtn"
          type="button"
          onClick={() => void navigate(CLIENT_ROUTES.CUSTOMER_CREATE)}
          data-testid="new-ticket-btn"
        >
          <span className="btnPlus" aria-hidden="true">
            ＋
          </span>
          New Ticket
        </button>
      </section>

      <section className="tableShell" aria-label="Tickets list" data-testid="tickets-list">
        {loading && (
          <div className="emptyState" role="status" data-testid="tickets-loading">
            Loading tickets...
          </div>
        )}

        {error && !loading && (
          <div className="emptyState" role="alert" data-testid="tickets-error">
            Failed to load tickets: {error}
          </div>
        )}

        {!loading && !error && filteredTickets.length === 0 && (
          <div className="emptyState" role="status" data-testid="tickets-empty-state">
            {query ? 'No tickets match your search.' : 'No tickets found.'}
          </div>
        )}

        {!loading && !error && filteredTickets.length > 0 && (
          <table className="ticketsTable" aria-label="Your tickets" data-testid="tickets-table">
            <thead>
              <tr>
                <th scope="col">Title</th>
                <th scope="col">Type</th>
                <th scope="col">Priority</th>
                <th scope="col">Status</th>
                <th scope="col">Deadline</th>
                <th scope="col">Users Impacted</th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.map((ticket) => (
                <tr key={ticket.id} data-testid={`ticket-row-${ticket.id}`}>
                  <td>{ticket.title}</td>
                  <td>{ticket.ticketTypeId}</td>
                  <td>{ticket.ticketPriorityId}</td>
                  <td>{ticket.ticketStatusId}</td>
                  <td>{new Date(ticket.deadline).toLocaleDateString('en-GB')}</td>
                  <td>{ticket.usersImpacted}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </CustomerLayout>
  );
};

export default CustomerPage;
