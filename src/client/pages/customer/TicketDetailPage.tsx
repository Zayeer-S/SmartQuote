import React from 'react';
import { useParams } from 'react-router-dom';
import TicketDetailCard from '../../features/shared/TicketDetailCard.js';
import { CLIENT_ROUTES } from '../../constants/client.routes.js';
import Breadcrumb from '../../components/Breadcrumb.js';
import TicketTitle from '../../features/shared/TicketTitle.js';

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
      <Breadcrumb
        route={CLIENT_ROUTES.CUSTOMER.ROOT}
        previousPage="Home"
        currentPage="Ticket Detail"
      />

      <TicketTitle ticketId={ticketId} />
      <TicketDetailCard ticketId={ticketId} />
    </div>
  );
};

export default TicketDetailPage;
