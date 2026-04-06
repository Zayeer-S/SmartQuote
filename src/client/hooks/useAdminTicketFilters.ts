import { useState, useMemo } from 'react';
import { KEYS } from '../lib/storage/keys.js';
import {
  useTicketFilters,
  DEFAULT_PAGE_SIZE,
  type PageSizeOption,
  type StatusFilter,
  type TypeFilter,
} from './useTicketFilters.js';
import type { TicketSummaryResponse } from '../../shared/contracts/ticket-contracts.js';

export type SlaBreachFilter = 'breached' | 'ok' | '';

export interface UseAdminTicketFiltersReturn {
  filteredTickets: TicketSummaryResponse[];
  search: string;
  setSearch: (value: string) => void;
  statusFilter: StatusFilter;
  setStatusFilter: (value: StatusFilter) => void;
  typeFilter: TypeFilter;
  setTypeFilter: (value: TypeFilter) => void;
  slaBreachFilter: SlaBreachFilter;
  setSlaBreachFilter: (value: SlaBreachFilter) => void;
  createdAfter: string;
  setCreatedAfter: (value: string) => void;
  createdBefore: string;
  setCreatedBefore: (value: string) => void;
  page: number;
  setPage: (page: number) => void;
  totalPages: number;
  pageSize: PageSizeOption;
  setPageSize: (size: PageSizeOption) => void;
  clearFilters: () => void;
}

// ---------------------------------------------------------------------------
// localStorage helpers -- scoped to this module
// ---------------------------------------------------------------------------

function readString(key: string): string {
  try {
    return localStorage.getItem(key) ?? '';
  } catch {
    return '';
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

// ---------------------------------------------------------------------------
// SLA sort key -- lower = more urgent.
// Breached tickets (hoursUntilDeadline < 0) sort before non-breached by
// treating their value as 0. Null SLA sorts last.
// ---------------------------------------------------------------------------

function slaUrgencyKey(ticket: TicketSummaryResponse): number {
  if (ticket.slaStatus === null) return Infinity;
  const hours = ticket.slaStatus.hoursUntilDeadline;
  return Math.max(0, hours);
}

export function useAdminTicketFilters(
  tickets: TicketSummaryResponse[]
): UseAdminTicketFiltersReturn {
  const [slaBreachFilter, setSlaBreachFilterRaw] = useState<SlaBreachFilter>(
    () => readString(KEYS.ADMIN_TICKET_FILTER_SLA_BREACH) as SlaBreachFilter
  );
  const [createdAfter, setCreatedAfterRaw] = useState<string>(() =>
    readString(KEYS.ADMIN_TICKET_FILTER_CREATED_AFTER)
  );
  const [createdBefore, setCreatedBeforeRaw] = useState<string>(() =>
    readString(KEYS.ADMIN_TICKET_FILTER_CREATED_BEFORE)
  );

  // Apply admin-only filters on top of the base ticket set before passing to
  // useTicketFilters, so all pagination/search/status/type logic is reused.
  const adminFiltered = useMemo(() => {
    return tickets.filter((ticket) => {
      if (slaBreachFilter === 'breached') {
        if (!ticket.slaStatus?.deadlineBreached) return false;
      } else if (slaBreachFilter === 'ok') {
        // Tickets with no SLA are excluded from the "ok" filter too
        if (!ticket.slaStatus || ticket.slaStatus.deadlineBreached) return false;
      }

      if (createdAfter) {
        if (new Date(ticket.createdAt) < new Date(createdAfter)) return false;
      }

      if (createdBefore) {
        // Treat createdBefore as end-of-day inclusive
        const ceiling = new Date(createdBefore);
        ceiling.setHours(23, 59, 59, 999);
        if (new Date(ticket.createdAt) > ceiling) return false;
      }

      return true;
    });
  }, [tickets, slaBreachFilter, createdAfter, createdBefore]);

  const base = useTicketFilters(adminFiltered);

  const setSlaBreachFilter = (value: SlaBreachFilter): void => {
    setSlaBreachFilterRaw(value);
    persist(KEYS.ADMIN_TICKET_FILTER_SLA_BREACH, value);
    base.setPage(1);
  };

  const setCreatedAfter = (value: string): void => {
    setCreatedAfterRaw(value);
    persist(KEYS.ADMIN_TICKET_FILTER_CREATED_AFTER, value);
    base.setPage(1);
  };

  const setCreatedBefore = (value: string): void => {
    setCreatedBeforeRaw(value);
    persist(KEYS.ADMIN_TICKET_FILTER_CREATED_BEFORE, value);
    base.setPage(1);
  };

  const clearFilters = (): void => {
    setSlaBreachFilterRaw('');
    setCreatedAfterRaw('');
    setCreatedBeforeRaw('');
    persist(KEYS.ADMIN_TICKET_FILTER_SLA_BREACH, '');
    persist(KEYS.ADMIN_TICKET_FILTER_CREATED_AFTER, '');
    persist(KEYS.ADMIN_TICKET_FILTER_CREATED_BEFORE, '');
    base.clearFilters();
  };

  return {
    ...base,
    slaBreachFilter,
    setSlaBreachFilter,
    createdAfter,
    setCreatedAfter,
    createdBefore,
    setCreatedBefore,
    clearFilters,
  };
}

export { DEFAULT_PAGE_SIZE, slaUrgencyKey };
export type { PageSizeOption, StatusFilter, TypeFilter };
