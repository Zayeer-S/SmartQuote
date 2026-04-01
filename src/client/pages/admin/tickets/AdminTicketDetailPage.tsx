import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { CLIENT_ROUTES } from '../../../constants/client.routes.js';
import './AdminTicketDetailPage.css';
import BaseTicketDetail from '../../../features/shared/BaseTicketDetail.js';

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

export default AdminTicketDetailPage;
