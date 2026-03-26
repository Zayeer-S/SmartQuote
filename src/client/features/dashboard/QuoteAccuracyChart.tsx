// src/client/features/dashboard/QuoteAccuracyChart.tsx

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import type { QuoteAccuracyResponse } from '../../../shared/contracts/analytics-contract';

interface QuoteAccuracyChartProps {
  data: QuoteAccuracyResponse;
}

/** Bucket quotes into accuracy ranges for a histogram-style display */
interface AccuracyBucket {
  range: string;
  count: number;
}

function buildBuckets(data: QuoteAccuracyResponse['data']): AccuracyBucket[] {
  const buckets: Record<string, number> = {
    '0-50%': 0,
    '51-70%': 0,
    '71-85%': 0,
    '86-95%': 0,
    '96-100%+': 0,
  };

  for (const point of data) {
    const pct = point.accuracyPercentage;
    if (pct <= 50) buckets['0-50%']++;
    else if (pct <= 70) buckets['51-70%']++;
    else if (pct <= 85) buckets['71-85%']++;
    else if (pct <= 95) buckets['86-95%']++;
    else buckets['96-100%+']++;
  }

  return Object.entries(buckets).map(([range, count]) => ({ range, count }));
}

const QuoteAccuracyChart: React.FC<QuoteAccuracyChartProps> = ({ data }) => {
  if (data.data.length === 0) {
    return (
      <p className="chart-empty-text" data-testid="quote-accuracy-empty">
        No settled quotes in this period.
      </p>
    );
  }

  const chartData = buildBuckets(data.data);

  return (
    <div
      aria-label="Quote accuracy distribution"
      data-testid="quote-accuracy-chart"
      className="chart-inner"
    >
      <p className="chart-summary-text">
        Avg accuracy: <strong>{data.averageAccuracyPercentage}%</strong>
      </p>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
          <XAxis dataKey="range" tick={{ fontSize: 10 }} />
          <YAxis
            tick={{ fontSize: 11 }}
            allowDecimals={false}
            label={{ value: 'Quotes', angle: -90, position: 'insideLeft', fontSize: 10 }}
          />
          <Tooltip
            formatter={(value: number | undefined) => [value ?? 0, 'Quotes']}
            contentStyle={{ fontSize: 12 }}
          />
          <ReferenceLine x="86-95%" stroke="#22c55e" strokeDasharray="4 2" />
          <Bar dataKey="count" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default QuoteAccuracyChart;
