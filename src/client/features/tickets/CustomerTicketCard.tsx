import React from 'react';
import { Link } from 'react-router-dom';
import { CLIENT_ROUTES } from '../../constants/client.routes';
import { getStatusBadgeClass, getPriorityBadgeClass } from '../../lib/utils/badge-utils';
import type { TicketDetailResponse } from '../../../shared/contracts/ticket-contracts';
import './CustomerTicketCard.css';

interface CustomerTicketCardProps {
  ticket: TicketDetailResponse;
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
        <span className={getStatusBadgeClass(ticket.ticketStatusName)} data-testid="ticket-status">
          {ticket.ticketStatusName}
        </span>
        <span
          className={getPriorityBadgeClass(ticket.ticketPriorityName)}
          data-testid="ticket-priority"
        >
          {ticket.ticketPriorityName}
        </span>
      </div>

      <h2 className="ticket-card-title">
        <Link to={CLIENT_ROUTES.CUSTOMER.TICKET(ticket.id)} data-testid="ticket-card-link">
          {ticket.title}
        </Link>
      </h2>

      <div className="ticket-card-meta">
        <span className="ticket-card-meta-item" data-testid="ticket-type">
          {ticket.ticketTypeName}
        </span>
        <span className="ticket-card-meta-divider" aria-hidden="true" />
        <span className="ticket-card-meta-item" data-testid="ticket-severity">
          {ticket.ticketSeverityName}
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
