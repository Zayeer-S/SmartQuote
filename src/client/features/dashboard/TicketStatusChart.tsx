import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import type { TicketDetailResponse } from '../../../shared/contracts/ticket-contracts';
import { TICKET_STATUSES } from '../../../shared/constants/lookup-values';

interface TicketStatusChartProps {
  tickets: TicketDetailResponse[];
}

const STATUS_COLORS: Record<string, string> = {
  [TICKET_STATUSES.OPEN]: '#3b82f6',
  [TICKET_STATUSES.ASSIGNED]: '#8b5cf6',
  [TICKET_STATUSES.IN_PROGRESS]: '#f59e0b',
  [TICKET_STATUSES.RESOLVED]: '#22c55e',
  [TICKET_STATUSES.CLOSED]: '#6b7280',
  [TICKET_STATUSES.CANCELLED]: '#ef4444',
};

const FALLBACK_COLOR = '#94a3b8';

const TicketStatusChart: React.FC<TicketStatusChartProps> = ({ tickets }) => {
  const counts = tickets.reduce<Record<string, number>>((acc, ticket) => {
    const status = ticket.ticketStatusName;
    acc[status] = (acc[status] ?? 0) + 1;
    return acc;
  }, {});

  const chartData = Object.entries(counts).map(([name, value]) => ({ name, value }));

  if (chartData.length === 0) {
    return null;
  }

  return (
    <div aria-label="Ticket status breakdown chart" data-testid="ticket-status-chart">
      <ResponsiveContainer width={160} height={160}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={46}
            outerRadius={72}
            dataKey="value"
            strokeWidth={2}
          >
            {chartData.map((entry) => (
              // eslint-disable-next-line @typescript-eslint/no-deprecated
              <Cell key={entry.name} fill={STATUS_COLORS[entry.name] ?? FALLBACK_COLOR} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TicketStatusChart;
