import React from 'react';
import { TICKET_STATUSES, TICKET_TYPES } from '../../../shared/constants/lookup-values';
import type { StatusFilter, TypeFilter } from '../../hooks/useTicketFilters';
import './TicketFilters.css';

const STATUS_OPTIONS = Object.values(TICKET_STATUSES);
const TYPE_OPTIONS = Object.values(TICKET_TYPES);

interface TicketFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: StatusFilter;
  onStatusChange: (value: StatusFilter) => void;
  typeFilter: TypeFilter;
  onTypeChange: (value: TypeFilter) => void;
  onClear: () => void;
}

const TicketFilters: React.FC<TicketFiltersProps> = ({
  search,
  onSearchChange,
  statusFilter,
  onStatusChange,
  typeFilter,
  onTypeChange,
  onClear,
}) => {
  const hasActiveFilters = search !== '' || statusFilter !== '' || typeFilter !== '';

  return (
    <div
      className="ticket-filters"
      role="search"
      aria-label="Filter tickets"
      data-testid="ticket-filters"
    >
      <input
        type="search"
        className="field-input ticket-filters-search"
        value={search}
        onChange={(e) => {
          onSearchChange(e.target.value);
        }}
        placeholder="Search tickets..."
        aria-label="Search tickets"
        data-testid="filter-search"
      />

      <select
        className="field-select ticket-filters-select"
        value={statusFilter}
        onChange={(e) => {
          onStatusChange(e.target.value as StatusFilter);
        }}
        aria-label="Filter by status"
        data-testid="filter-status"
      >
        <option value="">All statuses</option>
        {STATUS_OPTIONS.map((status) => (
          <option key={status} value={status}>
            {status}
          </option>
        ))}
      </select>

      <select
        className="field-select ticket-filters-select"
        value={typeFilter}
        onChange={(e) => {
          onTypeChange(e.target.value as TypeFilter);
        }}
        aria-label="Filter by type"
        data-testid="filter-type"
      >
        <option value="">All types</option>
        {TYPE_OPTIONS.map((type) => (
          <option key={type} value={type}>
            {type}
          </option>
        ))}
      </select>

      {hasActiveFilters && (
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={onClear}
          data-testid="filter-clear"
        >
          Clear
        </button>
      )}
    </div>
  );
};

export default TicketFilters;
