import React from 'react';
import TicketFilters from '../../collate/TicketFilters.js';
import type {
  StatusFilter,
  TypeFilter,
  SlaBreachFilter,
} from '../../../hooks/useAdminTicketFilters.js';
import './AdminTicketFilters.css';

interface AdminTicketFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: StatusFilter;
  onStatusChange: (value: StatusFilter) => void;
  typeFilter: TypeFilter;
  onTypeChange: (value: TypeFilter) => void;
  slaBreachFilter: SlaBreachFilter;
  onSlaBreachChange: (value: SlaBreachFilter) => void;
  createdAfter: string;
  onCreatedAfterChange: (value: string) => void;
  createdBefore: string;
  onCreatedBeforeChange: (value: string) => void;
  onClear: () => void;
}

const AdminTicketFilters: React.FC<AdminTicketFiltersProps> = ({
  search,
  onSearchChange,
  statusFilter,
  onStatusChange,
  typeFilter,
  onTypeChange,
  slaBreachFilter,
  onSlaBreachChange,
  createdAfter,
  onCreatedAfterChange,
  createdBefore,
  onCreatedBeforeChange,
  onClear,
}) => {
  const hasAdminFilters = slaBreachFilter !== '' || createdAfter !== '' || createdBefore !== '';

  return (
    <div className="admin-ticket-filters" data-testid="admin-ticket-filters">
      {/* Row 1: shared search + status + type filters */}
      <TicketFilters
        search={search}
        onSearchChange={onSearchChange}
        statusFilter={statusFilter}
        onStatusChange={onStatusChange}
        typeFilter={typeFilter}
        onTypeChange={onTypeChange}
        onClear={onClear}
      />

      {/* Row 2: admin-only filters */}
      <div className="admin-ticket-filters-row" role="group" aria-label="Admin ticket filters">
        <select
          className="field-select admin-ticket-filters-sla-select"
          value={slaBreachFilter}
          onChange={(e) => {
            onSlaBreachChange(e.target.value as SlaBreachFilter);
          }}
          aria-label="Filter by SLA breach status"
          data-testid="admin-filter-sla-breach"
        >
          <option value="">All SLA statuses</option>
          <option value="breached">Breached</option>
          <option value="ok">Within SLA</option>
        </select>

        <div className="admin-ticket-filters-date-group">
          <span className="admin-ticket-filters-date-label" id="created-after-label">
            From
          </span>
          <input
            type="date"
            className="field-input admin-ticket-filters-date-input"
            value={createdAfter}
            onChange={(e) => {
              onCreatedAfterChange(e.target.value);
            }}
            max={createdBefore || undefined}
            aria-labelledby="created-after-label"
            aria-label="Created after date"
            data-testid="admin-filter-created-after"
          />
        </div>

        <div className="admin-ticket-filters-date-group">
          <span className="admin-ticket-filters-date-label" id="created-before-label">
            To
          </span>
          <input
            type="date"
            className="field-input admin-ticket-filters-date-input"
            value={createdBefore}
            onChange={(e) => {
              onCreatedBeforeChange(e.target.value);
            }}
            min={createdAfter || undefined}
            aria-labelledby="created-before-label"
            aria-label="Created before date"
            data-testid="admin-filter-created-before"
          />
        </div>

        {hasAdminFilters && (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onClear}
            data-testid="admin-filter-clear"
          >
            Clear all
          </button>
        )}
      </div>
    </div>
  );
};

export default AdminTicketFilters;
