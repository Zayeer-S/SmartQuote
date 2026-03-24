import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useListTickets } from '../../hooks/tickets/useListTicket';
import { CLIENT_ROUTES } from '../../constants/client.routes';
import { useTicketFilters } from '../../hooks/useTicketFilters';
import CustomerTicketCard from './CustomerTicketCard';
import TicketFilters from './TicketFilters';
import TicketPagination from './TicketPagination';
import './TicketList.css';

const TicketList: React.FC = () => {
  const { execute, data, loading, error } = useListTickets();

  useEffect(() => {
    void execute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const allTickets = data?.tickets ?? [];

  const {
    filteredTickets,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
    page,
    setPage,
    totalPages,
    clearFilters,
  } = useTicketFilters(allTickets);

  if (loading) {
    return (
      <p className="loading-text" data-testid="tickets-loading">
        Loading tickets...
      </p>
    );
  }

  if (error) {
    return (
      <p className="feedback-error" role="alert" data-testid="tickets-error">
        {error}
      </p>
    );
  }

  if (allTickets.length === 0) {
    return (
      <div className="empty-state" data-testid="tickets-empty">
        <p className="empty-state-message">You have no tickets yet.</p>
        <Link className="btn btn-primary btn-sm" to={CLIENT_ROUTES.CUSTOMER.NEW_TICKET}>
          Submit your first ticket
        </Link>
      </div>
    );
  }

  return (
    <div data-testid="ticket-list-container">
      <TicketFilters
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        typeFilter={typeFilter}
        onTypeChange={setTypeFilter}
        onClear={clearFilters}
      />

      {filteredTickets.length === 0 ? (
        <p className="ticket-list-no-results" data-testid="tickets-no-results">
          No tickets match your filters.
        </p>
      ) : (
        <ul className="ticket-list" role="list" data-testid="ticket-list">
          {filteredTickets.map((ticket) => (
            <li key={ticket.id}>
              <CustomerTicketCard ticket={ticket} />
            </li>
          ))}
        </ul>
      )}

      <TicketPagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
};

export default TicketList;
