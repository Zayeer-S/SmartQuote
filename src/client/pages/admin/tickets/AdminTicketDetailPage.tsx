import React from 'react';
import { useParams } from 'react-router-dom';
import { CLIENT_ROUTES } from '../../../constants/client.routes.js';
import './AdminTicketDetailPage.css';
import TicketDetailCard from '../../../features/shared/TicketDetailCard.js';
import Breadcrumb from '../../../components/Breadcrumb.js';
import TicketTitle from '../../../features/shared/TicketTitle.js';

const AdminTicketDetailPage: React.FC = () => {
  const { ticketId } = useParams<{ ticketId: string }>();

  if (!ticketId) {
    return (
      <p className="feedback-error" role="alert" data-testid="admin-ticket-detail-page-no-id">
        No ticket ID provided.
      </p>
    );
  }

  return (
    <div className="admin-page" data-testid="admin-ticket-detail-page">
      <Breadcrumb
        route={CLIENT_ROUTES.ADMIN.ROOT}
        previousPage="Home"
        currentPage="Ticket Detail"
      />

      <TicketTitle ticketId={ticketId} />
      <TicketDetailCard ticketId={ticketId} />
    </div>
  );
};

export default AdminTicketDetailPage;
