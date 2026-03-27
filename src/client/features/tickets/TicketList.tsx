import React from 'react';
import { Link } from 'react-router-dom';
import { CLIENT_ROUTES } from '../../constants/client.routes.js';
import { useTicketFilters } from '../../hooks/useTicketFilters.js';
import type { TicketSummaryResponse } from '../../../shared/contracts/ticket-contracts.js';
import CustomerTicketCard from '../customer/dashboard/CustomerTicketCard.js';
import TicketFilters from '../collate/TicketFilters.js';
import TicketPagination from '../collate/TicketPagination.js';
import './TicketList.css';

interface TicketListProps {
  tickets: TicketSummaryResponse[];
}

const TicketList: React.FC<TicketListProps> = ({ tickets }) => {
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
  } = useTicketFilters(tickets);

  if (tickets.length === 0) {
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
