import React from 'react';
import { useParams } from 'react-router-dom';
import CustomerTicketDetail from '../../features/customer/ticket/CustomerTicketDetail.js';

const TicketDetailPage: React.FC = () => {
  const { ticketId } = useParams<{ ticketId: string }>();

  if (!ticketId) {
    return (
      <div data-testid="ticket-detail-page-error">
        <p>Invalid ticket link</p>
      </div>
    );
  }

  return (
    <div data-testid="ticket-detail-page">
      <CustomerTicketDetail ticketId={ticketId} />
    </div>
  );
};

export default TicketDetailPage;
