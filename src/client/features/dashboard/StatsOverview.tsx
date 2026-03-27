import React from 'react';
import type { TicketResponse } from '../../../shared/contracts/ticket-contracts.js';
import { TICKET_STATUSES } from '../../../shared/constants/lookup-values.js';

interface StatsOverviewProps {
  tickets: TicketResponse[];
}

interface StatCardProps {
  label: string;
  value: number;
  testId: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, testId }) => (
  <div className="stat-card" data-testid={testId}>
    <div>
      <span className="stat-card-value">{value}</span>
    </div>
    <span className="stat-card-label">{label}</span>
  </div>
);

const OPEN_STATUSES: string[] = [
  TICKET_STATUSES.OPEN,
  TICKET_STATUSES.ASSIGNED,
  TICKET_STATUSES.IN_PROGRESS,
];

const StatsOverview: React.FC<StatsOverviewProps> = ({ tickets }) => {
  const total = tickets.length;
  const open = tickets.filter((t) => OPEN_STATUSES.includes(t.ticketStatus)).length;
  const resolved = tickets.filter((t) => t.ticketStatus === TICKET_STATUSES.RESOLVED).length;

  return (
    <div
      className="stats-overview"
      aria-label="Ticket overview statistics"
      data-testid="stats-overview"
    >
      <StatCard label="Total Tickets" value={total} testId="stat-total" />
      <StatCard label="Active" value={open} testId="stat-open" />
      <StatCard label="Resolved" value={resolved} testId="stat-resolved" />
    </div>
  );
};

export default StatsOverview;
