import React from 'react';
import { CLIENT_ROUTES } from '../../constants/client.routes.js';
import type { TicketSummaryResponse } from '../../../shared/contracts/ticket-contracts.js';
import BaseTicketCard from '../shared/BaseTicketCard.js';

interface CustomerTicketCardProps {
  ticket: TicketSummaryResponse;
}

const CustomerTicketCard: React.FC<CustomerTicketCardProps> = ({ ticket }) => {
  const formattedDeadline = new Date(ticket.deadline).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <BaseTicketCard
      ticket={ticket}
      linkTo={CLIENT_ROUTES.CUSTOMER.TICKET(ticket.id)}
      variantClass="ticket-card"
      testId={`ticket-card-${ticket.id}`}
      linkTestId="ticket-card-link"
      metaItems={
        <>
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
        </>
      }
    />
  );
};

export default CustomerTicketCard;
