import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { CLIENT_ROUTES } from '../../constants/client.routes.js';
import CustomerTicketDetail from '../../features/tickets/CustomerTicketDetail.js';

const TicketDetailPage: React.FC = () => {
  const { ticketId } = useParams<{ ticketId: string }>();

  if (!ticketId) {
    return (
      <div data-testid="ticket-detail-page-error">
        <p>Invalid ticket link.</p>
        <Link to={CLIENT_ROUTES.CUSTOMER.TICKETS}>Back to tickets</Link>
      </div>
    );
  }

  return (
    <div data-testid="ticket-detail-page">
      <Link to={CLIENT_ROUTES.CUSTOMER.TICKETS} data-testid="back-to-tickets">
        Back to tickets
      </Link>
      <CustomerTicketDetail ticketId={ticketId} />
    </div>
  );
};

export default TicketDetailPage;
