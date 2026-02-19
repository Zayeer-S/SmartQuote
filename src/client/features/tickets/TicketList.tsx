import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useListTickets } from '../../hooks/tickets/useListTicket';
import { CLIENT_ROUTES } from '../../constants/client.routes';
import { useTicketFilters } from '../../pages/customer/useTicketFilters';
import TicketCard from './CustomerTicketCard';
import TicketFilters from './TicketFilters';
import TicketPagination from './TicketPagination';

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
    return <p data-testid="tickets-loading">Loading tickets...</p>;
  }

  if (error) {
    return (
      <p role="alert" data-testid="tickets-error">
        {error}
      </p>
    );
  }

  if (allTickets.length === 0) {
    return (
      <div data-testid="tickets-empty">
        <p>You have no tickets yet.</p>
        <Link to={CLIENT_ROUTES.CUSTOMER.NEW_TICKET}>Submit your first ticket</Link>
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
        <p data-testid="tickets-no-results">No tickets match your filters.</p>
      ) : (
        <ul role="list" data-testid="ticket-list">
          {filteredTickets.map((ticket) => (
            <li key={ticket.id}>
              <TicketCard ticket={ticket} />
            </li>
          ))}
        </ul>
      )}

      <TicketPagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
};

export default TicketList;
