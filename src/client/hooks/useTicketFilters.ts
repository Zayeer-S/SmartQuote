import { useState, useMemo } from 'react';
import { KEYS } from '../lib/storage/keys.js';
import type { TICKET_STATUSES, TICKET_TYPES } from '../../shared/constants/index.js';
import type { TicketSummaryResponse } from '../../shared/contracts/ticket-contracts.js';

export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;
export type PageSizeOption = (typeof PAGE_SIZE_OPTIONS)[number];

export type StatusFilter = (typeof TICKET_STATUSES)[keyof typeof TICKET_STATUSES] | '';
export type TypeFilter = (typeof TICKET_TYPES)[keyof typeof TICKET_TYPES] | '';

export interface UseTicketFiltersReturn {
  filteredTickets: TicketSummaryResponse[];
  search: string;
  setSearch: (value: string) => void;
  statusFilter: StatusFilter;
  setStatusFilter: (value: StatusFilter) => void;
  typeFilter: TypeFilter;
  setTypeFilter: (value: TypeFilter) => void;
  page: number;
  setPage: (page: number) => void;
  totalPages: number;
  pageSize: PageSizeOption;
  setPageSize: (size: PageSizeOption) => void;
  clearFilters: () => void;
}

// ---------------------------------------------------------------------------
// localStorage helpers -- scoped to this module, not exported
// ---------------------------------------------------------------------------

function readString(key: string): string {
  try {
    return localStorage.getItem(key) ?? '';
  } catch {
    return '';
  }
}

function readPageSize(): PageSizeOption {
  try {
    const raw = localStorage.getItem(KEYS.TICKET_PAGE_SIZE);
    const parsed = Number(raw);
    return (PAGE_SIZE_OPTIONS as readonly number[]).includes(parsed)
      ? (parsed as PageSizeOption)
      : DEFAULT_PAGE_SIZE;
  } catch {
    return DEFAULT_PAGE_SIZE;
  }
}

function persist(key: string, value: string): void {
  try {
    if (value === '') {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, value);
    }
  } catch {
    // storage unavailable -- silently ignore
  }
}

export function useTicketFilters(tickets: TicketSummaryResponse[]): UseTicketFiltersReturn {
  const [search, setSearchRaw] = useState<string>(() => readString(KEYS.TICKET_FILTER_SEARCH));
  const [statusFilter, setStatusFilterRaw] = useState<StatusFilter>(
    () => readString(KEYS.TICKET_FILTER_STATUS) as StatusFilter
  );
  const [typeFilter, setTypeFilterRaw] = useState<TypeFilter>(
    () => readString(KEYS.TICKET_FILTER_TYPE) as TypeFilter
  );
  const [pageSize, setPageSizeRaw] = useState<PageSizeOption>(readPageSize);
  const [page, setPage] = useState(1);

  const setSearch = (value: string): void => {
    setSearchRaw(value);
    persist(KEYS.TICKET_FILTER_SEARCH, value);
    setPage(1);
  };

  const setStatusFilter = (value: StatusFilter): void => {
    setStatusFilterRaw(value);
    persist(KEYS.TICKET_FILTER_STATUS, value);
    setPage(1);
  };

  const setTypeFilter = (value: TypeFilter): void => {
    setTypeFilterRaw(value);
    persist(KEYS.TICKET_FILTER_TYPE, value);
    setPage(1);
  };

  const setPageSize = (size: PageSizeOption): void => {
    setPageSizeRaw(size);
    persist(KEYS.TICKET_PAGE_SIZE, String(size));
    setPage(1);
  };

  const clearFilters = (): void => {
    setSearchRaw('');
    setStatusFilterRaw('');
    setTypeFilterRaw('');
    persist(KEYS.TICKET_FILTER_SEARCH, '');
    persist(KEYS.TICKET_FILTER_STATUS, '');
    persist(KEYS.TICKET_FILTER_TYPE, '');
    setPage(1);
  };

  const allFiltered = useMemo(() => {
    const term = search.trim().toLowerCase();

    return tickets.filter((ticket) => {
      if (statusFilter && ticket.ticketStatus !== statusFilter) return false;
      if (typeFilter && ticket.ticketType !== typeFilter) return false;
      if (term) {
        const searchable = [ticket.title, ticket.description, ticket.ticketType]
          .join(' ')
          .toLowerCase();
        if (!searchable.includes(term)) return false;
      }
      return true;
    });
  }, [tickets, search, statusFilter, typeFilter]);

  const totalPages = Math.max(1, Math.ceil(allFiltered.length / pageSize));
  const clampedPage = Math.min(page, totalPages);

  const filteredTickets = useMemo(() => {
    const start = (clampedPage - 1) * pageSize;
    return allFiltered.slice(start, start + pageSize);
  }, [allFiltered, clampedPage, pageSize]);

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
    pageSize,
    setPageSize,
    clearFilters,
  };
}
