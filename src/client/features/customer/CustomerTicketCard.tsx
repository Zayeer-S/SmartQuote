import React from 'react';
import { CLIENT_ROUTES } from '../../constants/client.routes.js';
import { getSlaBadgeClass } from '../../lib/utils/badge-utils.js';
import type { TicketSummaryResponse } from '../../../shared/contracts/ticket-contracts.js';
import BaseTicketCard from '../shared/BaseTicketCard.js';
import { useSlaCountdown } from '../../hooks/sla/useSlaCountdown.js';

interface CustomerTicketCardProps {
  ticket: TicketSummaryResponse;
  onSlaBreachConfirm?: () => void;
}

const CustomerTicketCard: React.FC<CustomerTicketCardProps> = ({ ticket, onSlaBreachConfirm }) => {
  const formattedDeadline = new Date(ticket.deadline).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const sla = ticket.slaStatus;

  const { display: countdownDisplay, breached } = useSlaCountdown(
    sla?.slaDeadline ?? null,
    onSlaBreachConfirm
  );

  const slaBadgeLabel = breached || (sla?.deadlineBreached ?? false) ? 'SLA Breached' : 'SLA OK';
  const slaBadgeTitle =
    sla !== null ? `${sla.policyName} - ${countdownDisplay || slaBadgeLabel}` : undefined;

  return (
    <BaseTicketCard
      ticket={ticket}
      linkTo={CLIENT_ROUTES.CUSTOMER.TICKET(ticket.id)}
      variantClass="ticket-card"
      testId={`ticket-card-${ticket.id}`}
      linkTestId="ticket-card-link"
      extraBadges={
        sla !== null ? (
          <span
            className={getSlaBadgeClass(breached || sla.deadlineBreached)}
            data-testid="ticket-sla-badge"
            title={slaBadgeTitle}
          >
            {slaBadgeLabel}
          </span>
        ) : undefined
      }
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
