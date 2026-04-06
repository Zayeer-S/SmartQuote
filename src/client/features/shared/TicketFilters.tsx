import React from 'react';
import { TICKET_STATUSES, TICKET_TYPES } from '../../../shared/constants/lookup-values.js';
import { useTicketPermissions } from '../../hooks/auth/useTicketPermissions.js';
import type { StatusFilter, TypeFilter } from '../../hooks/useTicketFilters.js';
import type { SlaBreachFilter } from '../../hooks/useAdminTicketFilters.js';
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
  // Admin-only fields -- omit entirely when rendering for customer context
  slaBreachFilter?: SlaBreachFilter;
  onSlaBreachChange?: (value: SlaBreachFilter) => void;
  createdAfter?: string;
  onCreatedAfterChange?: (value: string) => void;
  createdBefore?: string;
  onCreatedBeforeChange?: (value: string) => void;
  onClear: () => void;
}

const TicketFilters: React.FC<TicketFiltersProps> = ({
  search,
  onSearchChange,
  statusFilter,
  onStatusChange,
  typeFilter,
  onTypeChange,
  slaBreachFilter = '',
  onSlaBreachChange,
  createdAfter = '',
  onCreatedAfterChange,
  createdBefore = '',
  onCreatedBeforeChange,
  onClear,
}) => {
  const { canReadAll } = useTicketPermissions();

  const hasBaseFilters = search !== '' || statusFilter !== '' || typeFilter !== '';
  const hasAdminFilters = slaBreachFilter !== '' || createdAfter !== '' || createdBefore !== '';
  const hasActiveFilters = hasBaseFilters || hasAdminFilters;

  return (
    <div
      className="ticket-filters"
      role="search"
      aria-label="Filter tickets"
      data-testid="ticket-filters"
    >
      {/* Row 1: search, status, type, and clear button */}
      <div className="ticket-filters-row">
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

        {hasActiveFilters && !canReadAll && (
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

      {/* Row 2: admin-only filters -- gated by permission */}
      {canReadAll && (
        <div
          className="ticket-filters-row"
          role="group"
          aria-label="Admin ticket filters"
          data-testid="admin-ticket-filters-row"
        >
          <select
            className="field-select ticket-filters-select"
            value={slaBreachFilter}
            onChange={(e) => {
              onSlaBreachChange?.(e.target.value as SlaBreachFilter);
            }}
            aria-label="Filter by SLA breach status"
            data-testid="admin-filter-sla-breach"
          >
            <option value="">All SLA</option>
            <option value="breached">Breached</option>
            <option value="ok">Within SLA</option>
          </select>

          <div className="ticket-filters-date-group">
            <span className="ticket-filters-date-label" id="filter-created-after-label">
              From
            </span>
            <input
              type="date"
              className="field-input ticket-filters-date-input"
              value={createdAfter}
              onChange={(e) => {
                onCreatedAfterChange?.(e.target.value);
              }}
              max={createdBefore || undefined}
              aria-labelledby="filter-created-after-label"
              aria-label="Created after date"
              data-testid="admin-filter-created-after"
            />
          </div>

          <div className="ticket-filters-date-group">
            <span className="ticket-filters-date-label" id="filter-created-before-label">
              To
            </span>
            <input
              type="date"
              className="field-input ticket-filters-date-input"
              value={createdBefore}
              onChange={(e) => {
                onCreatedBeforeChange?.(e.target.value);
              }}
              min={createdAfter || undefined}
              aria-labelledby="filter-created-before-label"
              aria-label="Created before date"
              data-testid="admin-filter-created-before"
            />
          </div>

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
      )}
    </div>
  );
};

export default TicketFilters;
