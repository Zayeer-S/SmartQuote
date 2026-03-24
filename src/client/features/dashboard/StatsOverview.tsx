import React from 'react';
import type { TicketDetailResponse } from '../../../shared/contracts/ticket-contracts';
import { TICKET_STATUSES } from '../../../shared/constants/lookup-values';
import './StatsOverview.css';

interface StatsOverviewProps {
  tickets: TicketDetailResponse[];
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
  const open = tickets.filter((t) => OPEN_STATUSES.includes(t.ticketStatusName)).length;
  const resolved = tickets.filter((t) => t.ticketStatusName === TICKET_STATUSES.RESOLVED).length;

  return (
    <div
      className="stats-overview"
      aria-label="Ticket overview statistics"
      data-testid="stats-overview"
    >
      <StatCard label="Total Tickets" value={total} testId="stat-total" />
      <StatCard label="Open" value={open} testId="stat-open" />
      <StatCard label="Resolved" value={resolved} testId="stat-resolved" />
    </div>
  );
};

export default StatsOverview;
