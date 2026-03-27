import React from 'react';
import type { TicketSummaryResponse } from '../../../../shared/contracts/ticket-contracts.js';
import CustomerTicketCard from './CustomerTicketCard.js';
import BaseTicketList from '../../shared/BaseTicketList.js';

interface TicketListProps {
  tickets: TicketSummaryResponse[];
  loading: boolean;
  error: string | null;
}

const TicketList: React.FC<TicketListProps> = ({ tickets, loading, error }) => {
  return (
    <BaseTicketList
      tickets={tickets}
      renderItem={(ticket) => <CustomerTicketCard ticket={ticket} />}
      loading={loading}
      error={error}
      emptyMessage="You have no tickets yet."
      testIdPrefix="tickets"
    />
  );
};

export default TicketList;
