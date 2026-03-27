import React from 'react';
import { Link } from 'react-router-dom';
import { getStatusBadgeClass, getPriorityBadgeClass } from '../../lib/utils/badge-utils.js';
import type { TicketSummaryResponse } from '../../../shared/contracts/ticket-contracts.js';
import './BaseTicketCard.css';

export interface BaseTicketCardProps {
  ticket: TicketSummaryResponse;
  /** Route string for the card title link */
  linkTo: string;
  /** CSS variant class applied to the article -- e.g. "ticket-card" or "admin-ticket-card" */
  variantClass: string;
  /** data-testid applied to the article element */
  testId: string;
  /** data-testid applied to the title link */
  linkTestId: string;
  /** Additional badges rendered after status + priority -- optional */
  extraBadges?: React.ReactNode;
  /** Meta row content -- each variant composes its own */
  metaItems: React.ReactNode;
}

const BaseTicketCard: React.FC<BaseTicketCardProps> = ({
  ticket,
  linkTo,
  variantClass,
  testId,
  linkTestId,
  extraBadges,
  metaItems,
}) => {
  return (
    <article className={`card ${variantClass}`} data-testid={testId}>
      <div className="ticket-card-base-badges">
        <span className={getStatusBadgeClass(ticket.ticketStatus)} data-testid="ticket-status">
          {ticket.ticketStatus}
        </span>
        <span
          className={getPriorityBadgeClass(ticket.ticketPriority)}
          data-testid="ticket-priority"
        >
          {ticket.ticketPriority}
        </span>
        {extraBadges}
      </div>

      <h2 className="ticket-card-base-title">
        <Link to={linkTo} data-testid={linkTestId}>
          {ticket.title}
        </Link>
      </h2>

      <div className="ticket-card-base-meta">{metaItems}</div>
    </article>
  );
};

export default BaseTicketCard;
