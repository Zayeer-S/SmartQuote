import React from 'react';
import { Link } from 'react-router-dom';
import { CLIENT_ROUTES } from '../../constants/client.routes.js';
import { getStatusBadgeClass, getPriorityBadgeClass } from '../../lib/utils/badge-utils.js';
import type { TicketSummaryResponse } from '../../../shared/contracts/ticket-contracts.js';
import './AdminTicketCard.css';

interface AdminTicketCardProps {
  ticket: TicketSummaryResponse;
}

const AdminTicketCard: React.FC<AdminTicketCardProps> = ({ ticket }) => {
  const formattedDeadline = new Date(ticket.deadline).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const isAssigned = ticket.assignedToUserId !== null;

  return (
    <article className="admin-ticket-card" data-testid={`admin-ticket-card-${ticket.id}`}>
      <div className="admin-ticket-card-header">
        <div className="admin-ticket-card-badges">
          <span
            className={getPriorityBadgeClass(ticket.ticketPriority)}
            data-testid="ticket-priority"
          >
            {ticket.ticketPriority}
          </span>
          <span className={getStatusBadgeClass(ticket.ticketStatus)} data-testid="ticket-status">
            {ticket.ticketStatus}
          </span>
          <span
            className={`badge ${isAssigned ? 'badge-assigned' : 'admin-ticket-card-badge-unassigned'}`}
            data-testid="ticket-assigned-badge"
          >
            {isAssigned ? 'Assigned' : 'Unassigned'}
          </span>
        </div>
      </div>

      <h2 className="admin-ticket-card-title">
        <Link to={CLIENT_ROUTES.ADMIN.TICKET(ticket.id)} data-testid="admin-ticket-card-link">
          {ticket.title}
        </Link>
      </h2>

      <div className="admin-ticket-card-meta">
        <span data-testid="ticket-type">{ticket.ticketType}</span>
        <span data-testid="ticket-severity">{ticket.ticketSeverity}</span>
        <span data-testid="ticket-impact">{ticket.businessImpact}</span>
        <span data-testid="ticket-org">{ticket.organizationName}</span>
        <span data-testid="ticket-deadline">Due {formattedDeadline}</span>
      </div>
    </article>
  );
};

export default AdminTicketCard;
