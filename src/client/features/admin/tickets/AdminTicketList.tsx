import React from 'react';
import type { TicketSummaryResponse } from '../../../../shared/contracts/ticket-contracts.js';
import AdminTicketCard from './AdminTicketCard.js';
import BaseTicketList from '../../BaseTicketList.js';

interface AdminTicketListProps {
  tickets: TicketSummaryResponse[];
  loading: boolean;
  error: string | null;
}

const AdminTicketList: React.FC<AdminTicketListProps> = ({ tickets, loading, error }) => {
  return (
    <BaseTicketList
      tickets={tickets}
      renderItem={(ticket) => <AdminTicketCard ticket={ticket} />}
      loading={loading}
      error={error}
      emptyMessage="No tickets have been submitted yet."
      testIdPrefix="admin-tickets"
    />
  );
};

export default AdminTicketList;
