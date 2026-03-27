import React, { useEffect, useMemo } from 'react';
import { useAuth } from '../../hooks/contexts/useAuth';
import { useListTickets } from '../../hooks/tickets/useListTicket';
import StatsOverview from '../../features/shared/StatsOverview';
import AdminTicketList from '../../features/admin/tickets/AdminTicketList';
import './AdminDashboardPage.css';

const PRIORITY_ORDER: Record<string, number> = { P1: 1, P2: 2, P3: 3, P4: 4 };

export const AdminDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { execute, data, loading, error } = useListTickets();

  useEffect(() => {
    void execute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const tickets = data?.tickets ?? [];

  const sortedTickets = useMemo(
    () =>
      [...tickets].sort((a, b) => {
        const aAssigned = a.assignedToUserId !== null ? 0 : 1;
        const bAssigned = b.assignedToUserId !== null ? 0 : 1;
        if (aAssigned !== bAssigned) return aAssigned - bAssigned;
        const aPriority = PRIORITY_ORDER[a.ticketPriority] ?? 99;
        const bPriority = PRIORITY_ORDER[b.ticketPriority] ?? 99;
        return aPriority - bPriority;
      }),
    [tickets]
  );

  const firstName = user?.firstName ?? '';

  return (
    <div className="admin-dashboard-page" data-testid="admin-dashboard-page">
      <div>
        <h1 className="admin-dashboard-heading">Welcome back{firstName ? `, ${firstName}` : ''}</h1>
        <div className="admin-dashboard-line" />
      </div>

      {!loading && !error && (
        <div className="admin-dashboard-stats">
          <span className="admin-dashboard-stats-title">Overview</span>
          <StatsOverview tickets={tickets} />
        </div>
      )}

      <section aria-labelledby="admin-tickets-heading">
        <div className="admin-dashboard-section-header">
          <h2 className="admin-dashboard-section-title" id="admin-tickets-heading">
            Tickets
          </h2>
        </div>
        <AdminTicketList tickets={sortedTickets} loading={loading} error={error} />
      </section>
    </div>
  );
};
