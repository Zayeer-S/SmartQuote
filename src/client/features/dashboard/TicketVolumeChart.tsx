import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import type { TicketVolumeResponse } from '../../../shared/contracts/analytics-contract';

interface TicketVolumeChartProps {
  data: TicketVolumeResponse;
}

/** Format YYYY-MM-DD to a short label like "Mar 25" */
function formatDay(day: string): string {
  const date = new Date(`${day}T00:00:00`);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const TicketVolumeChart: React.FC<TicketVolumeChartProps> = ({ data }) => {
  if (data.data.length === 0) {
    return (
      <p className="chart-empty-text" data-testid="ticket-volume-empty">
        No tickets in this period.
      </p>
    );
  }

  const chartData = data.data.map((point) => ({
    label: formatDay(point.day),
    count: point.count,
  }));

  const total = data.data.reduce((sum, p) => sum + p.count, 0);

  return (
    <div
      aria-label="Ticket volume over time"
      data-testid="ticket-volume-chart"
      className="chart-inner"
    >
      <p className="chart-summary-text">
        Total: <strong>{total}</strong>
      </p>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
          <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
          <YAxis
            tick={{ fontSize: 11 }}
            allowDecimals={false}
            label={{ value: 'Tickets', angle: -90, position: 'insideLeft', fontSize: 10 }}
          />
          <Tooltip
            formatter={(value: number | undefined) => [value ?? 0, 'Tickets']}
            contentStyle={{ fontSize: 12 }}
          />
          <Line
            type="monotone"
            dataKey="count"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TicketVolumeChart;
