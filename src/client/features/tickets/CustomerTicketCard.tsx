import React from 'react';
import { Link } from 'react-router-dom';
import { CLIENT_ROUTES } from '../../constants/client.routes';
import type { TicketDetailResponse } from '../../../shared/contracts/ticket-contracts';

interface TicketCardProps {
  ticket: TicketDetailResponse;
}

const TicketCard: React.FC<TicketCardProps> = ({ ticket }) => {
  const formattedDeadline = new Date(ticket.deadline).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <article data-testid={`ticket-card-${ticket.id}`}>
      <div>
        <span data-testid="ticket-priority">{ticket.ticketPriorityName}</span>
        <span data-testid="ticket-status">{ticket.ticketStatusName}</span>
      </div>

      <h2>
        <Link to={CLIENT_ROUTES.CUSTOMER.TICKET(ticket.id)} data-testid="ticket-card-link">
          {ticket.title}
        </Link>
      </h2>

      <div>
        <span data-testid="ticket-type">{ticket.ticketTypeName}</span>
        <span data-testid="ticket-severity">{ticket.ticketSeverityName}</span>
        <span data-testid="ticket-deadline">Due {formattedDeadline}</span>
      </div>
    </article>
  );
};

export default TicketCard;
