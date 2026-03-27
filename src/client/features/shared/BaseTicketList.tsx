import React, { type ReactNode } from 'react';
import type { TicketSummaryResponse } from '../../../shared/contracts/ticket-contracts.js';
import { useTicketFilters } from '../../hooks/useTicketFilters.js';
import TicketFilters from '../collate/TicketFilters.js';
import TicketPagination from '../collate/TicketPagination.js';
import './BaseTicketList.css';

interface BaseTicketListProps<T extends TicketSummaryResponse> {
  tickets: T[];
  renderItem: (ticket: T) => ReactNode;
  loading: boolean;
  error: string | null;
  emptyMessage: string;
  /** Prefix applied to all data-testid attributes, e.g. "admin-tickets" or "tickets" */
  testIdPrefix: string;
}

function BaseTicketList<T extends TicketSummaryResponse>({
  tickets,
  renderItem,
  loading,
  error,
  emptyMessage,
  testIdPrefix,
}: BaseTicketListProps<T>): React.ReactElement | null {
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

  // useTicketFilters operates on TicketSummaryResponse[] and returns the same
  // items unmodified -- only filtered and paginated. The cast back to T[] is
  // safe because no structural transformation occurs inside the hook.
  const typedFilteredTickets = filteredTickets as T[];

  if (loading) {
    return (
      <p className="loading-text" data-testid={`${testIdPrefix}-loading`}>
        Loading tickets...
      </p>
    );
  }

  if (error) {
    return (
      <p className="feedback-error" role="alert" data-testid={`${testIdPrefix}-error`}>
        {error}
      </p>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="empty-state" data-testid={`${testIdPrefix}-empty`}>
        <p className="empty-state-message">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="base-ticket-list-container" data-testid={`${testIdPrefix}-container`}>
      <TicketFilters
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        typeFilter={typeFilter}
        onTypeChange={setTypeFilter}
        onClear={clearFilters}
      />

      {typedFilteredTickets.length === 0 ? (
        <div className="empty-state" data-testid={`${testIdPrefix}-no-results`}>
          <p className="empty-state-message">No tickets match your filters.</p>
        </div>
      ) : (
        <ul className="base-ticket-list" role="list" data-testid={`${testIdPrefix}-list`}>
          {typedFilteredTickets.map((ticket) => (
            <li key={ticket.id}>{renderItem(ticket)}</li>
          ))}
        </ul>
      )}

      <TicketPagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}

export default BaseTicketList;
