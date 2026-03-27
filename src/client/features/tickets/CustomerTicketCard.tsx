import React from 'react';
import { Link } from 'react-router-dom';
import { CLIENT_ROUTES } from '../../constants/client.routes.js';
import { getStatusBadgeClass, getPriorityBadgeClass } from '../../lib/utils/badge-utils.js';
import type { TicketResponse } from '../../../shared/contracts/ticket-contracts.js';

interface CustomerTicketCardProps {
  ticket: TicketResponse;
}

const CustomerTicketCard: React.FC<CustomerTicketCardProps> = ({ ticket }) => {
  const formattedDeadline = new Date(ticket.deadline).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <article className="card ticket-card" data-testid={`ticket-card-${ticket.id}`}>
      <div className="ticket-card-badges">
        <span className={getStatusBadgeClass(ticket.ticketStatus)} data-testid="ticket-status">
          {ticket.ticketStatus}
        </span>
        <span
          className={getPriorityBadgeClass(ticket.ticketPriority)}
          data-testid="ticket-priority"
        >
          {ticket.ticketPriority}
        </span>
      </div>

      <h2 className="ticket-card-title">
        <Link to={CLIENT_ROUTES.CUSTOMER.TICKET(ticket.id)} data-testid="ticket-card-link">
          {ticket.title}
        </Link>
      </h2>

      <div className="ticket-card-meta">
        <span className="ticket-card-meta-item" data-testid="ticket-type">
          {ticket.ticketType}
        </span>
        <span className="ticket-card-meta-divider" aria-hidden="true" />
        <span className="ticket-card-meta-item" data-testid="ticket-severity">
          {ticket.ticketSeverity}
        </span>
        <span className="ticket-card-meta-divider" aria-hidden="true" />
        <span className="ticket-card-meta-item" data-testid="ticket-deadline">
          Due {formattedDeadline}
        </span>
      </div>
    </article>
  );
};

export default CustomerTicketCard;
