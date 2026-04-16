import React, { useCallback, useEffect, useMemo } from 'react';
import { useAuth } from '../../hooks/contexts/useAuth.js';
import { useListTickets } from '../../hooks/tickets/useListTicket.js';
import { useAdminTicketFilters, slaUrgencyKey } from '../../hooks/useAdminTicketFilters.js';
import TicketFilters from '../../features/shared/TicketFilters.js';
import TicketPagination from '../../features/collate/TicketPagination.js';
import DashboardSidePanel from '../../features/shared/side-panels/DashboardSidePanel.js';
import BaseTicketList from '../../features/shared/BaseTicketList.js';
import AdminTicketCard from '../../features/admin/tickets/AdminTicketCard.js';
import { useTicketWsSubscription } from '../../hooks/updates/useTicketWsSubscription.js';
import { usePollingRefetch } from '../../hooks/updates/usePollingRefetch.js';
import '../../styles/DashboardPage.css';

const PRIORITY_ORDER: Record<string, number> = { P1: 1, P2: 2, P3: 3, P4: 4 };
const POLL_INTERVAL_MS = 30_000;

const AdminDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { execute, data, loading, error } = useListTickets();

  const fetchTickets = useCallback(() => {
    void execute();
  }, [execute]);

  useEffect(() => {
    fetchTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useTicketWsSubscription('admin:dashboard', fetchTickets);
  usePollingRefetch(fetchTickets, POLL_INTERVAL_MS);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const allTickets = data?.tickets ?? [];

  // Sort before filtering so filter results also arrive pre-sorted
  const sortedTickets = useMemo(
    () =>
      [...allTickets].sort((a, b) => {
        // 1. Unassigned first
        const aUnassigned = a.assignedToUserId === null ? 0 : 1;
        const bUnassigned = b.assignedToUserId === null ? 0 : 1;
        if (aUnassigned !== bUnassigned) return aUnassigned - bUnassigned;

        // 2. SLA urgency ascending (breached = 0, null SLA = Infinity)
        const slaDiff = slaUrgencyKey(a) - slaUrgencyKey(b);
        if (slaDiff !== 0) return slaDiff;

        // 3. Priority ascending (P1 = 1 ... P4 = 4)
        const aPriority = PRIORITY_ORDER[a.ticketPriority] ?? 99;
        const bPriority = PRIORITY_ORDER[b.ticketPriority] ?? 99;
        return aPriority - bPriority;
      }),
    [allTickets]
  );

  const {
    filteredTickets,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
    slaBreachFilter,
    setSlaBreachFilter,
    createdAfter,
    setCreatedAfter,
    createdBefore,
    setCreatedBefore,
    page,
    setPage,
    totalPages,
    clearFilters,
  } = useAdminTicketFilters(sortedTickets);

  const firstName = user?.firstName ?? '';

  return (
    <div className="dashboard-page" data-testid="dashboard-page">
      <div>
        <h1 className="dashboard-heading">Welcome back{firstName ? `, ${firstName}` : ''}</h1>
        <div className="dashboard-line" />
      </div>

      <div className="dashboard-layout">
        <section aria-labelledby="tickets-heading">
          <div className="dashboard-section-header">
            <h2 className="dashboard-section-title" id="tickets-heading">
              Tickets
            </h2>
          </div>

          <TicketFilters
            search={search}
            onSearchChange={setSearch}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            typeFilter={typeFilter}
            onTypeChange={setTypeFilter}
            slaBreachFilter={slaBreachFilter}
            onSlaBreachChange={setSlaBreachFilter}
            createdAfter={createdAfter}
            onCreatedAfterChange={setCreatedAfter}
            createdBefore={createdBefore}
            onCreatedBeforeChange={setCreatedBefore}
            onClear={clearFilters}
          />

          <BaseTicketList
            tickets={filteredTickets}
            renderItem={(ticket) => <AdminTicketCard ticket={ticket} />}
            loading={loading}
            error={error}
            emptyMessage="No tickets have been submitted yet."
            testIdPrefix="admin-tickets"
          />

          <TicketPagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </section>

        {!loading && !error && <DashboardSidePanel tickets={allTickets} />}
      </div>
    </div>
  );
};

export default AdminDashboardPage;
