import React from 'react';
import { CLIENT_ROUTES } from '../../../constants/client.routes.js';
import { getSlaBadgeClass } from '../../../lib/utils/badge-utils.js';
import type { TicketSummaryResponse } from '../../../../shared/contracts/ticket-contracts.js';
import BaseTicketCard from '../../shared/BaseTicketCard.js';
import { useSlaCountdown } from '../../../hooks/sla/useSlaCountdown.js';

interface AdminTicketCardProps {
  ticket: TicketSummaryResponse;
  onSlaBreachConfirm?: () => void;
}

const AdminTicketCard: React.FC<AdminTicketCardProps> = ({ ticket, onSlaBreachConfirm }) => {
  const formattedDeadline = new Date(ticket.deadline).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const isAssigned = ticket.assignedToUserId !== null;
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
      linkTo={CLIENT_ROUTES.ADMIN.TICKET(ticket.id)}
      variantClass="admin-ticket-card"
      testId={`admin-ticket-card-${ticket.id}`}
      linkTestId="admin-ticket-card-link"
      extraBadges={
        <>
          <span
            className={`badge ${isAssigned ? 'badge-assigned' : 'badge-unassigned'}`}
            data-testid="ticket-assigned-badge"
          >
            {isAssigned ? 'Assigned' : 'Unassigned'}
          </span>
          {sla !== null && (
            <span
              className={getSlaBadgeClass(breached || sla.deadlineBreached)}
              data-testid="ticket-sla-badge"
              title={slaBadgeTitle}
            >
              {slaBadgeLabel}
            </span>
          )}
        </>
      }
      metaItems={
        <>
          <span data-testid="ticket-type">{ticket.ticketType}</span>
          <span data-testid="ticket-severity">{ticket.ticketSeverity}</span>
          <span data-testid="ticket-impact">{ticket.businessImpact}</span>
          <span data-testid="ticket-org">{ticket.organizationName}</span>
          <span data-testid="ticket-deadline">Due {formattedDeadline}</span>
        </>
      }
    />
  );
};

export default AdminTicketCard;
