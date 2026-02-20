import React, { useEffect, useMemo } from 'react';
import { useListTickets } from '../../hooks/tickets/useListTicket';
import { useTicketFilters } from '../../hooks/useTicketFilters';
import AdminTicketCard from './AdminTicketCard';
import TicketFilters from './TicketFilters';
import TicketPagination from './TicketPagination';
import './AdminTicketList.css';

/**
 * Assigned tickets surface first, then sorted by priority within each group.
 */
const PRIORITY_ORDER: Record<string, number> = { P1: 1, P2: 2, P3: 3, P4: 4 };

const AdminTicketList: React.FC = () => {
  const { execute, data, loading, error } = useListTickets();

  useEffect(() => {
    void execute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sortedTickets = useMemo(() => {
    const tickets = data?.tickets ?? [];
    return [...tickets].sort((a, b) => {
      const aAssigned = a.assignedToUserId !== null ? 0 : 1;
      const bAssigned = b.assignedToUserId !== null ? 0 : 1;
      if (aAssigned !== bAssigned) return aAssigned - bAssigned;
      const aPriority = PRIORITY_ORDER[a.ticketPriorityName] ?? 99;
      const bPriority = PRIORITY_ORDER[b.ticketPriorityName] ?? 99;
      return aPriority - bPriority;
    });
  }, [data]);

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
  } = useTicketFilters(sortedTickets);

  if (loading) {
    return (
      <p className="loading-text" data-testid="admin-tickets-loading">
        Loading tickets...
      </p>
    );
  }

  if (error) {
    return (
      <p className="feedback-error" role="alert" data-testid="admin-tickets-error">
        {error}
      </p>
    );
  }

  if (sortedTickets.length === 0) {
    return (
      <div className="empty-state" data-testid="admin-tickets-empty">
        <p className="empty-state-message">No tickets have been submitted yet.</p>
      </div>
    );
  }

  return (
    <div className="admin-ticket-list-container" data-testid="admin-ticket-list-container">
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
        <div className="empty-state" data-testid="admin-tickets-no-results">
          <p className="empty-state-message">No tickets match your filters.</p>
        </div>
      ) : (
        <ul className="admin-ticket-list" role="list" data-testid="admin-ticket-list">
          {filteredTickets.map((ticket) => (
            <li key={ticket.id}>
              <AdminTicketCard ticket={ticket} />
            </li>
          ))}
        </ul>
      )}

      <TicketPagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
};

export default AdminTicketList;
