import React from 'react';
import { Link, useParams } from 'react-router-dom';
import BaseTicketDetail from '../../features/shared/BaseTicketDetail.js';
import { CLIENT_ROUTES } from '../../constants/client.routes.js';

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
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link
          className="breadcrumb-link"
          to={CLIENT_ROUTES.ADMIN.ROOT}
          data-testid="breadcrumb-tickets"
        >
          Home
        </Link>
        <span className="breadcrumb-sep" aria-hidden="true">
          /
        </span>
        <span className="breadcrumb-current" aria-current="page">
          Ticket Detail
        </span>
      </nav>

      <BaseTicketDetail ticketId={ticketId} />
    </div>
  );
};

export default TicketDetailPage;
