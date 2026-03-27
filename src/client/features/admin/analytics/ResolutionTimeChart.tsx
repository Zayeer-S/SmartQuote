import React from 'react';
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import type { ResolutionTimeResponse } from '../../../../shared/contracts/analytics-contract';

interface ResolutionTimeChartProps {
  data: ResolutionTimeResponse;
}

interface SeverityBucket {
  severity: string;
  avgHours: number;
  count: number;
}

const SEVERITY_ORDER = ['Low', 'Medium', 'High', 'Critical'];

const SEVERITY_COLORS: Record<string, string> = {
  Low: '#22c55e',
  Medium: '#f59e0b',
  High: '#f97316',
  Critical: '#ef4444',
};

const FALLBACK_COLOR = '#94a3b8';

const ResolutionTimeChart: React.FC<ResolutionTimeChartProps> = ({ data }) => {
  if (data.data.length === 0) {
    return (
      <p className="chart-empty-text" data-testid="resolution-time-empty">
        No resolved tickets in this period.
      </p>
    );
  }

  // Group by severity and compute average resolution time per group
  const buckets = data.data.reduce<Record<string, { total: number; count: number }>>(
    (acc, point) => {
      const key = point.ticketSeverity;

      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (!acc[key]) acc[key] = { total: 0, count: 0 };
      acc[key].total += point.resolutionTimeHours;
      acc[key].count += 1;
      return acc;
    },
    {}
  );

  const chartData: SeverityBucket[] = Object.entries(buckets)
    .map(([severity, { total, count }]) => ({
      severity,
      avgHours: Math.round((total / count) * 10) / 10,
      count,
    }))
    .sort((a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity));

  return (
    <div
      aria-label="Average resolution time by severity"
      data-testid="resolution-time-chart"
      className="chart-inner"
    >
      <p className="chart-summary-text">
        Overall avg: <strong>{data.averageHours}h</strong>
      </p>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
          <XAxis dataKey="severity" tick={{ fontSize: 11 }} />
          <YAxis
            tick={{ fontSize: 11 }}
            label={{ value: 'Avg hrs', angle: -90, position: 'insideLeft', fontSize: 10 }}
          />
          <Tooltip
            formatter={(value: number | undefined) => [`${String(value ?? 0)}h`, 'Avg resolution']}
            contentStyle={{ fontSize: 12 }}
          />
          <Bar dataKey="avgHours" radius={[3, 3, 0, 0]}>
            {chartData.map((entry) => (
              // eslint-disable-next-line @typescript-eslint/no-deprecated
              <Cell key={entry.severity} fill={SEVERITY_COLORS[entry.severity] ?? FALLBACK_COLOR} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ResolutionTimeChart;
