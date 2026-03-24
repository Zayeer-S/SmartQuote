import { useState, useMemo } from 'react';
import type { TICKET_STATUSES, TICKET_TYPES } from '../../shared/constants';
import type { TicketDetailResponse } from '../../shared/contracts/ticket-contracts';

const PAGE_SIZE = 10;

export type StatusFilter = (typeof TICKET_STATUSES)[keyof typeof TICKET_STATUSES] | '';
export type TypeFilter = (typeof TICKET_TYPES)[keyof typeof TICKET_TYPES] | '';

export interface UseTicketFiltersReturn {
  filteredTickets: TicketDetailResponse[];
  search: string;
  setSearch: (value: string) => void;
  statusFilter: StatusFilter;
  setStatusFilter: (value: StatusFilter) => void;
  typeFilter: TypeFilter;
  setTypeFilter: (value: TypeFilter) => void;
  page: number;
  setPage: (page: number) => void;
  totalPages: number;
  clearFilters: () => void;
}

export function useTicketFilters(tickets: TicketDetailResponse[]): UseTicketFiltersReturn {
  const [search, setSearchRaw] = useState('');
  const [statusFilter, setStatusFilterRaw] = useState<StatusFilter>('');
  const [typeFilter, setTypeFilterRaw] = useState<TypeFilter>('');
  const [page, setPage] = useState(1);

  const setSearch = (value: string): void => {
    setSearchRaw(value);
    setPage(1);
  };

  const setStatusFilter = (value: StatusFilter): void => {
    setStatusFilterRaw(value);
    setPage(1);
  };

  const setTypeFilter = (value: TypeFilter): void => {
    setTypeFilterRaw(value);
    setPage(1);
  };

  const clearFilters = (): void => {
    setSearchRaw('');
    setStatusFilterRaw('');
    setTypeFilterRaw('');
    setPage(1);
  };

  const allFiltered = useMemo(() => {
    const term = search.trim().toLowerCase();

    return tickets.filter((ticket) => {
      if (statusFilter && ticket.ticketStatusName !== statusFilter) return false;
      if (typeFilter && ticket.ticketTypeName !== typeFilter) return false;
      if (term) {
        const searchable = [ticket.title, ticket.description, ticket.ticketTypeName]
          .join(' ')
          .toLowerCase();
        if (!searchable.includes(term)) return false;
      }
      return true;
    });
  }, [tickets, search, statusFilter, typeFilter]);

  const totalPages = Math.max(1, Math.ceil(allFiltered.length / PAGE_SIZE));

  const clampedPage = Math.min(page, totalPages);

  const filteredTickets = useMemo(() => {
    const start = (clampedPage - 1) * PAGE_SIZE;
    return allFiltered.slice(start, start + PAGE_SIZE);
  }, [allFiltered, clampedPage]);

  return {
    filteredTickets,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
    page: clampedPage,
    setPage,
    totalPages,
    clearFilters,
  };
}
