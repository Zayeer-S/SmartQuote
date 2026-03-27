import React, { useEffect, useMemo } from 'react';
import { useListTickets } from '../../../hooks/tickets/useListTicket.js';
import AdminTicketList from '../../../features/admin/tickets/AdminTicketList.js';
import './AdminTicketsPage.css';

const PRIORITY_ORDER: Record<string, number> = { P1: 1, P2: 2, P3: 3, P4: 4 };

const AdminTicketsPage: React.FC = () => {
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
      const aPriority = PRIORITY_ORDER[a.ticketPriority] ?? 99;
      const bPriority = PRIORITY_ORDER[b.ticketPriority] ?? 99;
      return aPriority - bPriority;
    });
  }, [data]);

  return (
    <div className="admin-page" data-testid="admin-tickets-page">
      <div className="page-header">
        <h1 className="page-title">Tickets</h1>
      </div>
      <AdminTicketList tickets={sortedTickets} loading={loading} error={error} />
    </div>
  );
};

export default AdminTicketsPage;
